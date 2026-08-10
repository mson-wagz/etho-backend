import { getCurrencySymbol } from '../common/utils/currency.util';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { AnalyticsEventType } from 'src/types/enums/analytics.enum';

@Injectable()
export class ProductRepository extends Repository<Product> {
  constructor(private dataSource: DataSource) {
    super(Product, dataSource.createEntityManager());
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const product = await this.findOne({
      where: { slug },
      relations: [
        'brand',
        'category',
        'variants',
        'variants.option_selections',
        'variants.option_selections.option_choice',
        'variants.option_selections.option_choice.option_type',
        'product_certifications',
        'product_certifications.certification',
        'product_filters',
        'product_filters.filter',
      ],
    });
    return product ? this.transformVariantsStructure(product) : null;
  }

  async findBySourceUrl(sourceUrl: string): Promise<Product | null> {
    const product = await this.findOne({
      where: { source_url: sourceUrl },
      relations: [
        'brand',
        'category',
        'variants',
        'variants.option_selections',
        'variants.option_selections.option_choice',
        'variants.option_selections.option_choice.option_type',
      ],
    });
    return product ? this.transformVariantsStructure(product) : null;
  }

  async findWithFilters(filters: {
    categoryIds?: string[];
    materials?: string[];
    certifications?: string[];
    badges?: string[];
    searchQuery?: string;
    sortBy?: 'popular' | 'newest';
    limit: number;
    status?: string;
    offset: number;
  }): Promise<{ products: Product[]; total: number }> {
    let query = this.createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('variants.option_selections', 'option_selections')
      .leftJoinAndSelect('option_selections.option_choice', 'option_choice')
      .leftJoinAndSelect('option_choice.option_type', 'option_type')
      .leftJoinAndSelect('product.product_filters', 'product_filters')
      .leftJoinAndSelect('product_filters.filter', 'filter')
      .leftJoinAndSelect(
        'product.product_certifications',
        'product_certifications',
      )
      .leftJoinAndSelect(
        'product_certifications.certification',
        'certification',
      )
      .leftJoinAndSelect(
        'product.analytics_events',
        'analytics_events',
        'analytics_events.event_type = :eventType',
        {
          eventType: AnalyticsEventType.PRODUCT_VIEWED,
        },
      );

    if (filters.searchQuery && filters.searchQuery.trim()) {
      const strictSearch = `'${filters.searchQuery.trim().replace(/'/g, "''")}'`;
      query = query.andWhere(
        "product.search_vector @@ to_tsquery('simple', :strictSearch)",
        { strictSearch },
      );

      query = query
        .addSelect(
          "ts_rank(product.search_vector, to_tsquery('simple', :strictSearch))",
          'search_rank',
        )
        .orderBy('search_rank', 'DESC');
    }

    if (filters.sortBy && filters.sortBy === 'popular') {
      query = query
        .groupBy('product.id')
        .addGroupBy('category.id')
        .addGroupBy('variants.id')
        .addGroupBy('option_selections.id')
        .addGroupBy('option_choice.id')
        .addGroupBy('option_type.id')
        .addGroupBy('product_filters.id')
        .addGroupBy('filter.id')
        .addGroupBy('product_certifications.id')
        .addGroupBy('certification.id')
        .addGroupBy('brand.id')
        .addGroupBy('analytics_events.id')
        .addSelect('COUNT(analytics_events.id)', 'view_count')
        .orderBy('view_count', 'DESC');
    } else {
      query = query.orderBy('product.created_at', 'DESC');
    }
    const queryBuilder = query;

    if (filters.categoryIds !== undefined) {
      if (filters.categoryIds.length > 0) {
        queryBuilder.andWhere('category.id IN (:...categoryIds)', {
          categoryIds: filters.categoryIds,
        });
      } else {
        queryBuilder.andWhere('1 = 0');
      }
    }

    if (filters.certifications) {
      const certificationsArray = Array.isArray(filters.certifications)
        ? filters.certifications
        : [filters.certifications];

      if (certificationsArray.length > 0) {
        const certificationsConditions = certificationsArray
          .map(
            (_, index) =>
              `(certification.name ILIKE :certification${index} OR certification.slug ILIKE :certificationSlug${index})`,
          )
          .join(' OR ');

        queryBuilder.andWhere(`(${certificationsConditions})`);

        certificationsArray.forEach((certification, index) => {
          queryBuilder.setParameter(
            `certification${index}`,
            `%${certification}%`,
          );
          queryBuilder.setParameter(
            `certificationSlug${index}`,
            `%${certification}%`,
          );
        });
      }
    }

    if (filters.badges) {
      const badgesArray = Array.isArray(filters.badges)
        ? filters.badges
        : [filters.badges];

      if (badgesArray.length > 0) {
        const badgesConditions = badgesArray
          .map(
            (_, index) =>
              `(filter.name ILIKE :badge${index} OR filter.slug ILIKE :badgeSlug${index})`,
          )
          .join(' OR ');

        queryBuilder.andWhere(`(${badgesConditions})`);

        badgesArray.forEach((badge, index) => {
          queryBuilder.setParameter(`badge${index}`, `%${badge}%`);
          queryBuilder.setParameter(`badgeSlug${index}`, `%${badge}%`);
        });
      }
    }

    const total = await queryBuilder.getCount();

    const products = await queryBuilder
      .skip(filters.offset)
      .take(filters.limit)
      .getMany();

    return {
      products: products.map((product) =>
        this.transformVariantsStructure(product),
      ),
      total,
    };
  }

  async findByBrandId(brandId: string): Promise<Product[]> {
    const products = await this.find({ where: { brand_id: brandId } });
    return products.map((product) => this.transformVariantsStructure(product));
  }

  async findByCategoryId(categoryId: string): Promise<Product[]> {
    const products = await this.find({ where: { category_id: categoryId } });
    return products.map((product) => this.transformVariantsStructure(product));
  }

  async searchProducts(
    searchQuery: string,
    limit: number = 20,
  ): Promise<Product[]> {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return [];
    }
    const strictSearch = `'${searchQuery.trim().replace(/'/g, "''")}'`;
    const products = await this.createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('variants.option_selections', 'option_selections')
      .leftJoinAndSelect('option_selections.option_choice', 'option_choice')
      .leftJoinAndSelect('option_choice.option_type', 'option_type')
      .leftJoinAndSelect('product.product_filters', 'product_filters')
      .leftJoinAndSelect('product_filters.filter', 'filter')
      .leftJoinAndSelect(
        'product.product_certifications',
        'product_certifications',
      )
      .leftJoinAndSelect(
        'product_certifications.certification',
        'certification',
      )
      .where("product.search_vector @@ to_tsquery('simple', :strictSearch)", {
        strictSearch,
      })
      .orderBy(
        "ts_rank(product.search_vector, to_tsquery('simple', :strictSearch))",
        'DESC',
      )
      .setParameter('strictSearch', strictSearch)
      .limit(limit)
      .getMany();
    return products.map((product) => this.transformVariantsStructure(product));
  }

  async searchWithFilters(
    searchQuery: string,
    filters: {
      brandIds?: string[];
      categoryIds?: string[];
      minPrice?: number;
      maxPrice?: number;
      status?: string;
    },
    limit: number = 20,
  ): Promise<Product[]> {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return [];
    }
    const strictSearch = `'${searchQuery.trim().replace(/'/g, "''")}'`;
    const query = this.createQueryBuilder('product').where(
      "product.search_vector @@ to_tsquery('simple', :strictSearch)",
      { strictSearch },
    );

    if (filters.brandIds?.length) {
      query.andWhere('product.brand_id IN (:...brandIds)', {
        brandIds: filters.brandIds,
      });
    }

    if (filters.categoryIds?.length) {
      query.andWhere('product.category_id IN (:...categoryIds)', {
        categoryIds: filters.categoryIds,
      });
    }

    if (filters.minPrice !== undefined) {
      query.andWhere('product.price >= :minPrice', {
        minPrice: filters.minPrice,
      });
    }

    if (filters.maxPrice !== undefined) {
      query.andWhere('product.price <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    if (filters.status) {
      query.andWhere('product.status = :status', { status: filters.status });
    }

    const products = await query
      .orderBy(
        "ts_rank(product.search_vector, to_tsquery('simple', :strictSearch))",
        'DESC',
      )
      .setParameter('strictSearch', strictSearch)
      .limit(limit)
      .getMany();

    return products.map((product) => this.transformVariantsStructure(product));
  }

  async findBestSellers(): Promise<Product[]> {
    const products = await this.createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('variants.option_selections', 'option_selections')
      .leftJoinAndSelect('option_selections.option_choice', 'option_choice')
      .leftJoinAndSelect('option_choice.option_type', 'option_type')
      .leftJoinAndSelect('product.product_filters', 'product_filters')
      .leftJoinAndSelect('product_filters.filter', 'filter')
      .leftJoinAndSelect(
        'product.product_certifications',
        'product_certifications',
      )
      .leftJoinAndSelect(
        'product_certifications.certification',
        'certification',
      )
      .leftJoin('product.analytics_events', 'analytics_events')
      .where(`analytics_events.event_type = :eventType`, {
        eventType: AnalyticsEventType.PRODUCT_ADDED_TO_CART,
      })
      .groupBy('product.id')
      .addGroupBy('category.id')
      .addGroupBy('variants.id')
      .addGroupBy('option_selections.id')
      .addGroupBy('option_choice.id')
      .addGroupBy('option_type.id')
      .addGroupBy('product_filters.id')
      .addGroupBy('filter.id')
      .addGroupBy('product_certifications.id')
      .addGroupBy('certification.id')
      .addGroupBy('brand.id')
      .addSelect('COUNT(analytics_events.id)', 'cart_count')
      .orderBy('cart_count', 'DESC')
      .take(12)
      .getMany();

    if (products.length < 12) {
      const latestProducts = await this.createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('product.variants', 'variants')
        .leftJoinAndSelect('variants.option_selections', 'option_selections')
        .leftJoinAndSelect('option_selections.option_choice', 'option_choice')
        .leftJoinAndSelect('option_choice.option_type', 'option_type')
        .leftJoinAndSelect('product.product_filters', 'product_filters')
        .leftJoinAndSelect('product_filters.filter', 'filter')
        .leftJoinAndSelect(
          'product.product_certifications',
          'product_certifications',
        )
        .leftJoinAndSelect(
          'product_certifications.certification',
          'certification',
        )
        .where('product.id NOT IN (:...ids)', {
          ids:
            products.length > 0
              ? products.map((p) => p.id)
              : ['00000000-0000-0000-0000-000000000000'],
        })
        .orderBy('product.created_at', 'DESC')
        .take(12 - products.length)
        .getMany();

      products.push(...latestProducts);
    }

    return products
      .slice(0, 12)
      .map((product) => this.transformVariantsStructure(product));
  }

  transformVariantsStructure(product: Product): any {
    if (!product.variants || product.variants.length === 0) {
      return product;
    }

    const variantsByOptionType: Record<string, any[]> = {};

    product.variants.forEach((variant) => {
      if (
        !variant.option_selections ||
        variant.option_selections.length === 0
      ) {
        return;
      }

      variant.option_selections.forEach((selection) => {
        const optionTypeName = selection.option_choice?.option_type?.name;
        if (!optionTypeName) return;

        if (!variantsByOptionType[optionTypeName]) {
          variantsByOptionType[optionTypeName] = [];
        }

        variantsByOptionType[optionTypeName].push({
          id: variant.id,
          choice: selection.option_choice?.choice,
          price: variant.price,
          currency: variant.currency,
          currency_symbol: getCurrencySymbol(variant.currency),
          compare_at_price: variant.compare_at_price,
          availability: variant.availability,
          images: variant.images,
          source_url: variant.source_url,
        });
      });
    });

    return {
      ...product,
      variants: variantsByOptionType,
    };
  }

  async findRelatedProducts(
    productId: string,
    categoryId: string,
    brandId: string,
    limit: number,
  ): Promise<Product[]> {
    const baseJoins = (alias: string) =>
      this.createQueryBuilder(alias)
        .leftJoinAndSelect(`${alias}.brand`, 'brand')
        .leftJoinAndSelect(`${alias}.category`, 'category')
        .leftJoinAndSelect(`${alias}.variants`, 'variants')
        .leftJoinAndSelect('variants.option_selections', 'option_selections')
        .leftJoinAndSelect('option_selections.option_choice', 'option_choice')
        .leftJoinAndSelect('option_choice.option_type', 'option_type')
        .leftJoinAndSelect(`${alias}.product_filters`, 'product_filters')
        .leftJoinAndSelect('product_filters.filter', 'filter');

    const categoryProducts = await baseJoins('product')
      .where('product.category_id = :categoryId', { categoryId })
      .andWhere('product.id != :productId', { productId })
      .orderBy('product.created_at', 'DESC')
      .take(limit)
      .getMany();

    if (categoryProducts.length >= limit) {
      return categoryProducts.map((p) => this.transformVariantsStructure(p));
    }

    const needed = limit - categoryProducts.length;
    const excludeIds = [productId, ...categoryProducts.map((p) => p.id)];

    const brandProducts = await baseJoins('product')
      .where('product.brand_id = :brandId', { brandId })
      .andWhere('product.id NOT IN (:...excludeIds)', { excludeIds })
      .orderBy('product.created_at', 'DESC')
      .take(needed)
      .getMany();

    return [...categoryProducts, ...brandProducts].map((p) =>
      this.transformVariantsStructure(p),
    );
  }

  async deleteProductsWithRelations(brandId: string): Promise<{
    productsDeleted: number;
    variantsDeleted: number;
    optionSelectionsDeleted: number;
    optionTypesDeleted: number;
    filtersDeleted: number;
    certificationsDeleted: number;
    analyticsEventsDeleted: number;
  }> {
    return await this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);

      const products = await productRepo.find({
        where: { brand_id: brandId },
        select: ['id'],
      });

      if (products.length === 0) {
        return {
          productsDeleted: 0,
          variantsDeleted: 0,
          optionSelectionsDeleted: 0,
          optionTypesDeleted: 0,
          filtersDeleted: 0,
          certificationsDeleted: 0,
          analyticsEventsDeleted: 0,
        };
      }

      const productIds = products.map((p) => p.id);

      const variants = await manager.query(
        `SELECT id FROM product_variants WHERE product_id = ANY($1)`,
        [productIds],
      );
      const variantIds = variants.map((v: any) => v.id);

      const optionSelectionsResult = await manager.query(
        `DELETE FROM variant_option_selections WHERE product_variant_id = ANY($1)`,
        [variantIds],
      );

      const analyticsResult = await manager.query(
        `DELETE FROM analytics_events WHERE product_id = ANY($1)`,
        [productIds],
      );

      const filtersResult = await manager.query(
        `DELETE FROM product_filters WHERE product_id = ANY($1)`,
        [productIds],
      );

      const certificationsResult = await manager.query(
        `DELETE FROM product_certifications WHERE product_id = ANY($1)`,
        [productIds],
      );

      const optionTypesResult = await manager.query(
        `DELETE FROM product_variant_types WHERE product_id = ANY($1)`,
        [productIds],
      );

      const variantsResult = await manager.query(
        `DELETE FROM product_variants WHERE product_id = ANY($1)`,
        [productIds],
      );

      const productsResult = await manager.query(
        `DELETE FROM products WHERE brand_id = $1`,
        [brandId],
      );

      return {
        productsDeleted: productsResult[1] || 0,
        variantsDeleted: variantsResult[1] || 0,
        optionSelectionsDeleted: optionSelectionsResult[1] || 0,
        optionTypesDeleted: optionTypesResult[1] || 0,
        filtersDeleted: filtersResult[1] || 0,
        certificationsDeleted: certificationsResult[1] || 0,
        analyticsEventsDeleted: analyticsResult[1] || 0,
      };
    });
  }
}
