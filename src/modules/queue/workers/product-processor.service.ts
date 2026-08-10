import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DataSource, EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { IngestionRunRepository } from '../../../repository/ingestion-run.repository';
import { RedisService } from '../../redis/redis.service';
import { MiscellaneousService } from '../../miscellaneous/miscellaneous.service';
import { Product } from '../../../entities/product.entity';
import { ProductVariant } from '../../../entities/product-variant.entity';
import { Brand } from '../../../entities/brand.entity';
import { ProductCertification } from '../../../entities/product-certification.entity';
import { ProductFilter } from '../../../entities/product-filter.entity';
import { IngestionRun } from '../../../entities/ingestion-run.entity';
import { ProductOptionType } from '../../../entities/product-option-type.entity';
import { OptionChoice } from '../../../entities/option-choice.entity';
import { VariantOptionSelection } from '../../../entities/variant-option-selection.entity';
import {
  EthicsTag,
  FilteredProduct,
  ProcessedProductResult,
} from '../dto/filtered-product.dto';
import { ProductAvailability } from '../../../common/enums/product.enum';
import * as crypto from 'crypto';

interface ProductJob {
  filteredProduct: FilteredProduct;
  siteId: string;
  ingestionRunId?: string;
}

@Processor('filtered-products', {
  concurrency: 5,
  limiter: {
    max: 50,
    duration: 1000,
  },
})
@Injectable()
export class ProductProcessorService extends WorkerHost {
  private readonly logger = new Logger(ProductProcessorService.name);
  private readonly confidenceThreshold: number;
  private readonly targetCurrency = 'USD';

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly ingestionRunRepository: IngestionRunRepository,
    private readonly redisService: RedisService,
    private readonly miscellaneousService: MiscellaneousService,
  ) {
    super();
    this.confidenceThreshold = this.configService.get<number>(
      'FILTER_CONFIDENCE_THRESHOLD',
      0.7,
    );
  }

  async process(job: Job<ProductJob>): Promise<ProcessedProductResult> {
    const { filteredProduct, ingestionRunId } = job.data;

    try {
      await job.updateProgress(10);

      const result = await this.processProduct(filteredProduct);

      await job.updateProgress(90);

      if (ingestionRunId) {
        await this.updateIngestionRunStats(ingestionRunId, result);
      }

      await job.updateProgress(100);

      return result;
    } catch (error) {
      this.logger.error(`Job ${job.id} failed:`, error);
      throw error; // Let BullMQ handle retries
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ProductJob>, error: Error) {
    this.logger.error(`Job ${job.id} failed:`, error.message);
  }

  private async processProduct(
    filteredProduct: FilteredProduct,
  ): Promise<ProcessedProductResult> {
    const validationError = this.validateFilteredProduct(filteredProduct);
    if (validationError) {
      this.logger.warn(
        `Validation failed for product ${filteredProduct.id}: ${validationError}`,
      );
      return {
        success: false,
        action: 'error',
        error: validationError,
        filteredProductId: filteredProduct.id,
      };
    }

    await this.normalizeVariantPricesToTargetCurrency(filteredProduct);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingProduct = await queryRunner.manager.findOne(Product, {
        where: { source_url: filteredProduct.url },
      });

      let product: Product;
      let action: 'created' | 'updated' | 'skipped' = 'created';

      if (existingProduct) {
        const contentHash = this.generateContentHash(filteredProduct);
        if (existingProduct.product_content_hash === contentHash) {
          await queryRunner.rollbackTransaction();
          return {
            success: true,
            productId: existingProduct.id,
            action: 'skipped',
            filteredProductId: filteredProduct.id,
          };
        }

        product = await this.updateProduct(
          queryRunner.manager,
          existingProduct,
          filteredProduct,
        );
        action = 'updated';
      } else {
        product = await this.createProduct(
          queryRunner.manager,
          filteredProduct,
        );
        action = 'created';
      }

      await this.upsertVariants(queryRunner.manager, product, filteredProduct);

      const variantCount = await queryRunner.manager.count(ProductVariant, {
        where: { product_id: product.id },
      });

      if (variantCount === 0) {
        throw new Error(
          `No variants were created for product ${product.id}. Product cannot exist without variants.`,
        );
      }

      await this.assignCertifications(
        queryRunner.manager,
        product,
        filteredProduct,
      );

      await this.assignEthicsTags(
        queryRunner.manager,
        product,
        filteredProduct,
      );

      await queryRunner.commitTransaction();
      return {
        success: true,
        productId: product.id,
        action,
        filteredProductId: filteredProduct.id,
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to process product ${filteredProduct.id}:`,
        error,
      );
      return {
        success: false,
        action: 'error',
        error: error.message,
        filteredProductId: filteredProduct.id,
      };
    } finally {
      await queryRunner.release();
    }
  }

  private async normalizeVariantPricesToTargetCurrency(
    product: FilteredProduct,
  ): Promise<void> {
    let rates: Record<string, number>;
    try {
      rates = await this.miscellaneousService.getConversionRates();
    } catch (error) {
      this.logger.warn(
        `Exchange rates unavailable; saving product ${product.id} in original currencies: ${
          error instanceof Error ? error.message : error
        }`,
      );
      return;
    }

    for (const variant of product.variants) {
      const from = variant.price.currency;
      if (!from || from === this.targetCurrency) continue;

      const rate = rates[from];
      if (!rate || rate <= 0) {
        this.logger.warn(
          `No ${this.targetCurrency} rate for currency "${from}" (product ${product.id}); keeping original currency`,
        );
        continue;
      }
      
      variant.price.amount = this.roundMoney(variant.price.amount / rate);
      if (variant.price.compareAtPrice != null) {
        variant.price.compareAtPrice = this.roundMoney(
          variant.price.compareAtPrice / rate,
        );
      }
      variant.price.currency = this.targetCurrency;
    }
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private validateFilteredProduct(product: FilteredProduct): string | null {
    if (!product.id) return 'Missing id';
    if (!product.title) return 'Missing title';
    if (!product.variants || product.variants.length === 0)
      return 'Missing variants array';
    if (
      product.variants.some(
        (variant) =>
          !variant.attributes || Object.keys(variant.attributes).length === 0,
      )
    )
      return 'Product variants are corrupted or missing attributes';
    if (
      product.variants.some(
        (variant) =>
          !variant.price ||
          variant.price.amount == null ||
          !variant.price.currency,
      )
    )
      return 'Some variants have missing price information';
    if (!product.category_id) return 'Missing category_id';
    if (
      product.variants.some(
        (variant) => !variant.images || variant.images.length === 0,
      )
    )
      return 'Some variants have missing images';
    if (
      product.variants.every(
        (variant) =>
          this.filterValidImageUrls(variant.images ?? []).length === 0,
      )
    )
      return 'All variants have no valid image URLs';

    if (!product.brandId) return 'Missing brandId';
    if (!product.url) return 'Missing url';
    if (!product.ethicsTags || product.ethicsTags.length === 0)
      return 'Missing ethicsTags';

    return null;
  }

  private generateContentHash(product: FilteredProduct): string {
    const content = JSON.stringify({
      title: product.title,
      description: product.description,
      variants: product.variants,
      materials: product.materials,
      ethicsTags: product.ethicsTags,
      certifications: product.certifications,
    });
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async createProduct(
    manager: EntityManager,
    filteredProduct: FilteredProduct,
  ): Promise<Product> {
    const brand = await this.resolveBrand(manager, filteredProduct);

    const slug = this.generateSlug(filteredProduct.title);
    const contentHash = this.generateContentHash(filteredProduct);

    const product = manager.create(Product, {
      brand_id: brand.id,
      name: filteredProduct.title,
      slug,
      short_description: filteredProduct.shortDescription,
      description:
        filteredProduct.description || filteredProduct.shortDescription,
      category_id: filteredProduct.category_id,
      materials: filteredProduct.materials || [],
      extraction_method: 'llm',
      extraction_confidence:
        filteredProduct.filterConfidence >= this.confidenceThreshold
          ? 'high'
          : 'low',
      filter_confidence: filteredProduct.filterConfidence,
      scraped_at: new Date(filteredProduct.scrapedAt),
      filtered_at: new Date(filteredProduct.filteredAt),
      product_content_hash: contentHash,
      source_url: filteredProduct.url,
    });

    return manager.save(Product, product);
  }

  private async updateProduct(
    manager: EntityManager,
    existingProduct: Product,
    filteredProduct: FilteredProduct,
  ): Promise<Product> {
    const brand = await this.resolveBrand(manager, filteredProduct);

    const contentHash = this.generateContentHash(filteredProduct);

    existingProduct.brand_id = brand.id;
    existingProduct.name = filteredProduct.title;
    existingProduct.slug = this.generateSlug(filteredProduct.title);
    existingProduct.short_description = filteredProduct.shortDescription;
    existingProduct.description =
      filteredProduct.description || filteredProduct.shortDescription;
    existingProduct.category_id = filteredProduct.category_id;
    existingProduct.materials = filteredProduct.materials || [];
    existingProduct.filter_confidence = filteredProduct.filterConfidence;
    existingProduct.filtered_at = new Date(filteredProduct.filteredAt);
    existingProduct.product_content_hash = contentHash;
    existingProduct.source_url = filteredProduct.url;

    return manager.save(Product, existingProduct);
  }

  private async resolveBrand(
    manager: EntityManager,
    filteredProduct: FilteredProduct,
  ): Promise<Brand> {
    const brandId = filteredProduct.brandId;

    const brand = await manager.findOne(Brand, { where: { id: brandId } });

    if (!brand) {
      this.logger.warn(`Brand not found: ${brandId}, unable to create product`);
      throw new Error(`Brand not found: ${brandId}`);
    }

    return brand;
  }

  private async upsertVariants(
    manager: EntityManager,
    product: Product,
    filteredProduct: FilteredProduct,
  ): Promise<void> {
    await manager.delete(ProductVariant, { product_id: product.id });

    const existingOptionTypes = await manager.find(ProductOptionType, {
      where: { product_id: product.id },
    });
    const optionTypeMap = new Map<string, ProductOptionType>();
    existingOptionTypes.forEach((ot) => optionTypeMap.set(ot.name, ot));

    const allOptionNames = new Set<string>();
    for (const variantData of filteredProduct.variants) {
      if (variantData.attributes) {
        Object.keys(variantData.attributes).forEach((name) =>
          allOptionNames.add(name),
        );
      }
    }

    const missingOptionNames = Array.from(allOptionNames).filter(
      (name) => !optionTypeMap.has(name),
    );
    if (missingOptionNames.length > 0) {
      const newOptionTypes = missingOptionNames.map((name) =>
        manager.create(ProductOptionType, {
          product_id: product.id,
          name,
        }),
      );
      const savedOptionTypes = await manager.save(
        ProductOptionType,
        newOptionTypes,
      );
      savedOptionTypes.forEach((ot) => optionTypeMap.set(ot.name, ot));
    }

    const optionTypeIds = Array.from(optionTypeMap.values()).map((ot) => ot.id);
    const existingChoices =
      optionTypeIds.length > 0
        ? await manager
            .createQueryBuilder(OptionChoice, 'oc')
            .where('oc.option_type_id IN (:...ids)', { ids: optionTypeIds })
            .getMany()
        : [];

    const choiceMap = new Map<string, OptionChoice>();
    existingChoices.forEach((choice) => {
      const key = `${choice.option_type_id}:${choice.choice}`;
      choiceMap.set(key, choice);
    });

    // Process each variant
    for (const variantData of filteredProduct.variants) {
      const availability = this.mapAvailability(variantData.availability);
      const validatedImages = this.filterValidImageUrls(variantData.images);
      if (validatedImages.length === 0) {
        this.logger.warn(
          `Variant for product ${product.id} has no valid images, skipping variant creation`,
        );
        continue;
      }
      const currency = variantData.price.currency;
      const variant = manager.create(ProductVariant, {
        product_id: product.id,
        images: validatedImages,
        price: variantData.price.amount,
        currency,
        compare_at_price: variantData.price.compareAtPrice || undefined,
        availability,
        source_url: variantData.productPageUrl,
      });

      const savedVariant = await manager.save(ProductVariant, variant);

      if (
        variantData.attributes &&
        Object.keys(variantData.attributes).length > 0
      ) {
        await this.assignVariantAttributes(
          manager,
          savedVariant,
          variantData.attributes,
          optionTypeMap,
          choiceMap,
        );
      }
    }
  }

  private async assignVariantAttributes(
    manager: EntityManager,
    variant: ProductVariant,
    attributes: Record<string, string>,
    optionTypeMap: Map<string, ProductOptionType>,
    choiceMap: Map<string, OptionChoice>,
  ): Promise<void> {
    const newChoices: OptionChoice[] = [];
    const attributeEntries: Array<{
      optionType: ProductOptionType;
      choiceValue: string;
    }> = [];

    for (const [optionName, choiceValue] of Object.entries(attributes)) {
      const optionType = optionTypeMap.get(optionName);
      if (!optionType) {
        this.logger.warn(
          `Option type ${optionName} not found in map, skipping`,
        );
        continue;
      }

      attributeEntries.push({ optionType, choiceValue });

      const choiceKey = `${optionType.id}:${choiceValue}`;
      let optionChoice = choiceMap.get(choiceKey);

      if (!optionChoice) {
        optionChoice = manager.create(OptionChoice, {
          option_type_id: optionType.id,
          choice: choiceValue,
        });
        newChoices.push(optionChoice);
        choiceMap.set(choiceKey, optionChoice);
      }
    }

    if (newChoices.length > 0) {
      await manager.save(OptionChoice, newChoices);
    }

    const selections: VariantOptionSelection[] = [];
    for (const { optionType, choiceValue } of attributeEntries) {
      const choiceKey = `${optionType.id}:${choiceValue}`;
      const optionChoice = choiceMap.get(choiceKey);

      if (optionChoice) {
        selections.push(
          manager.create(VariantOptionSelection, {
            product_variant_id: variant.id,
            option_choice_id: optionChoice.id,
          }),
        );
      }
    }

    if (selections.length > 0) {
      await manager.save(VariantOptionSelection, selections);
    }
  }

  private mapAvailability(availability: string): ProductAvailability {
    const mapping: Record<string, ProductAvailability> = {
      InStock: ProductAvailability.IN_STOCK,
      OutOfStock: ProductAvailability.OUT_OF_STOCK,
      PreOrder: ProductAvailability.PREORDER,
    };
    return mapping[availability] || ProductAvailability.IN_STOCK;
  }

  private async assignCertifications(
    manager: EntityManager,
    product: Product,
    filteredProduct: FilteredProduct,
  ): Promise<void> {
    if (
      !filteredProduct.certifications ||
      filteredProduct.certifications.length === 0
    ) {
      return;
    }

    await manager.delete(ProductCertification, { product_id: product.id });

    for (const cert of filteredProduct.certifications) {
      const productCert = manager.create(ProductCertification, {
        product_id: product.id,
        certification_id: cert.id,
        detected_from: cert.detectedFrom,
      });
      await manager.save(ProductCertification, productCert);
    }
  }

  private async assignEthicsTags(
    manager: EntityManager,
    product: Product,
    filteredProduct: FilteredProduct,
  ): Promise<void> {
    if (
      !filteredProduct.ethicsTags ||
      filteredProduct.ethicsTags.length === 0
    ) {
      return;
    }

    await manager.delete(ProductFilter, { product_id: product.id });
    const dedupedTags = new Map<string, EthicsTag>();
    for (const tag of filteredProduct.ethicsTags) {
      dedupedTags.set(tag.id, tag);
    }

    const uniqueTags = Array.from(dedupedTags.values());

    for (const tag of uniqueTags) {
      const productFilter = manager.create(ProductFilter, {
        product_id: product.id,
        filter_id: tag.id,
        confidence_score: tag.confidence,
        evidence_text: tag.evidenceText,
        source: tag.source,
        assigned_by: 'llm',
      });
      await manager.save(ProductFilter, productFilter);
    }
  }

  private filterValidImageUrls(urls: string[]): string[] {
    const IMAGE_EXTENSIONS = new Set([
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.avif',
      '.gif',
      '.svg',
      '.bmp',
      '.tiff',
      '.tif',
    ]);

    return urls.filter((url) => {
      try {
        const { pathname } = new URL(url);
        const lastSegment = pathname.split('/').pop() ?? '';
        const dotIndex = lastSegment.lastIndexOf('.');
        if (dotIndex === -1) return false;
        const ext = lastSegment.slice(dotIndex).toLowerCase();
        return IMAGE_EXTENSIONS.has(ext);
      } catch {
        return false;
      }
    });
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 200);
  }

  private async updateIngestionRunStats(
    runId: string,
    result: ProcessedProductResult,
  ): Promise<void> {
    try {
      const ingestionRun = (await this.ingestionRunRepository.findOne({
        where: { id: runId },
      })) as IngestionRun;

      switch (result.action) {
        case 'created':
          ingestionRun.products_added++;
          try {
            await this.redisService.incrementIngestionProductCreated(runId);
          } catch {
            //skip progress logging errors
          }
          break;
        case 'updated':
          ingestionRun.products_updated++;
          try {
            await this.redisService.incrementIngestionProductUpdated(runId);
          } catch {
            //skip progress logging errors
          }
          break;
        case 'skipped':
          ingestionRun.products_excluded++;
          try {
            await this.redisService.incrementIngestionProductSkipped(runId);
          } catch {
            //skip progress logging errors
          }
          break;
        case 'error':
          ingestionRun.errors_count++;
          if (!ingestionRun.errors) {
            ingestionRun.errors = [] as Array<{
              message: string;
              stack?: string;
              timestamp: string;
            }>;
          }
          ingestionRun.errors.push({
            message: result.error || 'Unknown error',
            timestamp: new Date().toISOString(),
          });
          try {
            await this.redisService.incrementIngestionProductErrored(runId);
            await this.redisService.appendIngestionError(runId, {
              message: result.error || 'Unknown error',
              retryAfterSeconds: null,
              timestamp: new Date().toISOString(),
            });
          } catch {
            //skip progress logging errors
          }
          break;
      }

      await this.redisService.incrementIngestionProductProcessed(runId);
      ingestionRun.products_fetched++;

      await this.ingestionRunRepository.save(ingestionRun);
    } catch (error) {
      this.logger.error('Failed to update ingestion run stats:', error);
    }
  }

  async completeIngestionRun(
    runId: string,
    finalCounts: {
      products_fetched: number;
      products_added: number;
      products_updated: number;
      products_excluded: number;
    },
  ): Promise<void> {
    try {
      const result = await this.ingestionRunRepository.update(runId, {
        status: 'completed',
        completed_at: new Date(),
        products_fetched: finalCounts.products_fetched,
        products_added: finalCounts.products_added,
        products_updated: finalCounts.products_updated,
        products_excluded: finalCounts.products_excluded,
      });

      if (!result.affected) {
        this.logger.warn(`Ingestion run ${runId} not found for completion`);
        return;
      }

      await this.redisService.setCrawlProgressStage(runId, 'done');

      this.logger.log(`Completed ingestion run ${runId}`);
    } catch (error) {
      this.logger.error('Failed to complete ingestion run:', error);
      throw error;
    }
  }
}
