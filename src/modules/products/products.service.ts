import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ProductRepository } from '../../repository/product.repository';
import { CategoryRepository } from '../../repository/category.repository';
import { SearchQueryRepository } from '../../repository/search-query.repository';
import { FilterProductDto } from './dto/filter-product.dto';
import {
  ProductResponse,
  ProductListResponse,
} from './dto/product-response.dto';
import { ProductStatsDto } from './dto/admin-product.dto';
import { AnalyticsEventRepository } from 'src/repository/analytics-event.repository';
import { And, DataSource, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ProductAvailability } from 'src/common/enums/product.enum';
import { AnalyticsEventType } from 'src/types/enums/analytics.enum';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly searchQueryRepository: SearchQueryRepository,
    private readonly analyticsEventRepository: AnalyticsEventRepository,
    private readonly dataSource: DataSource,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async getProducts(
    filter: FilterProductDto,
    sessionId?: string,
  ): Promise<ProductListResponse> {
    try {
      if (
        filter.q !== undefined &&
        (!filter.q || filter.q.trim().length === 0)
      ) {
        throw new BadRequestException(
          'Search query cannot be empty when provided',
        );
      }

      const page = Number(filter.page) || 1;
      const limit = Math.min(Number(filter.limit) || 20, 100);
      const offset = (page - 1) * limit;

      let categoryIds: string[] | undefined;
      if (filter.category) {
        categoryIds = await this.categoryRepository.findDescendantIdsBySlug(
          filter.category,
        );
      }

      const { products, total } = await this.productRepository.findWithFilters({
        categoryIds,
        materials: filter.materials,
        certifications: filter.certifications,
        sortBy: (filter.sortBy as 'popular' | 'newest') || 'newest',
        badges: filter.badges,
        searchQuery: filter.q?.trim(),
        limit,
        offset,
      });

      if (filter.q?.trim() && sessionId) {
        try {
          await this.searchQueryRepository.logSearch(
            filter.q.trim(),
            total,
            sessionId,
          );
        } catch (error) {
          console.error('Failed to log search query:', error);
        }
      }

      const productResponses: ProductResponse[] = products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        category: {
          id: product.category_id,
          name: product.category?.name || '',
          slug: product.category?.slug || '',
        },
        materials: product.materials || [],
        variants: product.variants || [],
        slug: product.slug,
        sourceUrl: product.source_url,
        badges: product.product_filters.map((pf) => pf.filter) || [],
        certifications: product.product_certifications || [],
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        brand: product.brand
          ? {
              id: product.brand.id,
              name: product.brand.name,
            }
          : null,
      }));

      return {
        products: productResponses,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      console.error('Service error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  async getProductBySlug(slug: string): Promise<ProductResponse | null> {
    try {
      const product = await this.productRepository.findBySlug(slug);
      if (!product) return null;

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        category: {
          id: product.category_id,
          name: product.category?.name || '',
          slug: product.category?.slug || '',
        },
        variants: product.variants || [],
        brand: product.brand
          ? {
              id: product.brand.id,
              name: product.brand.name,
            }
          : null,
        slug: product.slug,
        sourceUrl: product.source_url,
        badges: product.product_filters.map((pf) => pf.filter) || [],
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
  }

  async getBestSellers() {
    try {
      const products = await this.productRepository.findBestSellers();

      return products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        category: {
          id: product.category_id,
          name: (product.category as any)?.name || '',
          slug: (product.category as any)?.slug || '',
        },
        materials: product.materials || [],
        variants: product.variants as any,
        slug: product.slug,
        sourceUrl: product.source_url,
        badges: product.product_filters.map((pf) => pf.filter) || [],
        certifications: product.product_certifications || [],
        brand: product.brand
          ? {
              id: product.brand.id,
              name: product.brand.name,
            }
          : null,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch best sellers: ${error.message}`);
    }
  }

  async getAdminProductStats(): Promise<ProductStatsDto> {
    try {
      const stats: ProductStatsDto = {} as ProductStatsDto;
      //current default period is last 30 days for all stats
      const today = new Date();
      const priorDate = new Date().setDate(today.getDate() - 30);

      const totalProducts = await this.productRepository.count();
      stats.total_products = {
        value: totalProducts,
        ingestion_trend_pcnt:
          Math.round(
            this.calculateTrendPercentage(
              totalProducts,
              await this.getPreviousPeriodCount(
                new Date(priorDate),
                new Date(),
              ),
            ) * 100,
          ) / 100,
        trend: { value: 30, period: 'days' },
      };

      const inStockCount = await this.productRepository.count({
        where: { variants: { availability: ProductAvailability.IN_STOCK } },
      });
      stats.in_stock = {
        value: inStockCount,
        in_stock_trend_pcnt:
          Math.round(
            this.calculateTrendPercentage(
              inStockCount,
              await this.getPreviousPeriodInStockCount(
                new Date(priorDate),
                new Date(),
              ),
            ) * 100,
          ) / 100,
        trend: { value: 30, period: 'days' },
      };

      const outOfStockCount = await this.productRepository.count({
        where: {
          variants: { availability: In([ProductAvailability.OUT_OF_STOCK]) },
        },
      });
      stats.out_of_stock = {
        value: outOfStockCount,
      };

      const inCartAdds = await this.analyticsEventRepository.count({
        where: {
          event_type: AnalyticsEventType.PRODUCT_ADDED_TO_CART,
          created_at: MoreThanOrEqual(new Date(priorDate)),
        },
      });
      stats.in_cart_adds = {
        value: inCartAdds,
      };
      return stats;
    } catch (error) {
      console.error('Failed to fetch admin product stats:', error);
      throw new Error(`Failed to fetch admin product stats: ${error.message}`);
    }
  }

  async getProductById(id: string): Promise<any> {
    try {
      const product = await this.productRepository.findOne({
        where: { id },
        relations: [
          'brand',
          'category',
          'variants',
          'product_filters',
          'product_filters.filter',
          'product_certifications',
          'product_certifications.certification',
        ],
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category
          ? {
              id: product.category.id,
              name: product.category.name,
            }
          : null,
        source_url: product.source_url,
        brand: product.brand
          ? {
              id: product.brand.id,
              name: product.brand.name,
            }
          : null,
        variants: product.variants.map((v) => ({
          id: v.id,
          price: parseFloat(v.price.toString()),
          currency: v.currency,
          compare_at_price: v.compare_at_price
            ? parseFloat(v.compare_at_price.toString())
            : null,
          availability: v.availability,
          images: v.images,
        })),
        filters: product.product_filters.map((pf) => ({
          id: pf.filter.id,
          name: pf.filter.name,
        })),
        certifications: product.product_certifications.map((pc) => ({
          id: pc.certification.id,
          name: pc.certification.name,
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
  }

  async updateProduct(id: string, updateData: UpdateProductDto): Promise<any> {
    return await this.dataSource.transaction(async (manager) => {
      try {
        const productRepo = manager.getRepository('Product');
        const variantRepo = manager.getRepository('ProductVariant');
        const filterRepo = manager.getRepository('ProductFilter');
        const certificationRepo = manager.getRepository('ProductCertification');

        const product = await productRepo.findOne({
          where: { id },
          relations: ['variants', 'product_filters', 'product_certifications'],
        });

        if (!product) {
          throw new NotFoundException(`Product with ID ${id} not found`);
        }

        if (updateData.name !== undefined) {
          product.name = updateData.name;
        }
        if (updateData.description !== undefined) {
          product.description = updateData.description;
        }
        if (updateData.category_id !== undefined) {
          product.category_id = updateData.category_id;
        }
        if (updateData.source_url !== undefined) {
          product.source_url = updateData.source_url;
        }

        await productRepo.save(product);

        if (updateData.variants && updateData.variants.length > 0) {
          for (const variantData of updateData.variants) {
            if (variantData.id) {
              const variant = await variantRepo.findOne({
                where: { id: variantData.id },
              });
              if (variant) {
                if (variantData.price !== undefined) {
                  variant.price = variantData.price;
                }
                if (variantData.currency !== undefined) {
                  variant.currency = variantData.currency;
                }
                if (variantData.compare_at_price !== undefined) {
                  variant.compare_at_price = variantData.compare_at_price;
                }
                if (variantData.availability !== undefined) {
                  variant.availability = variantData.availability;
                }
                await variantRepo.save(variant);
              }
            }
          }
        }

        if (updateData.filter_ids !== undefined) {
          await filterRepo.delete({ product_id: id });

          if (updateData.filter_ids.length > 0) {
            const newFilters = updateData.filter_ids.map((filterId) =>
              filterRepo.create({
                product_id: id,
                filter_id: filterId,
                confidence_score: 1.0,
                source: 'manual',
                assigned_by: 'admin',
              }),
            );
            await filterRepo.save(newFilters);
          }
        }

        if (updateData.certification_ids !== undefined) {
          await certificationRepo.delete({ product_id: id });

          if (updateData.certification_ids.length > 0) {
            const newCertifications = updateData.certification_ids.map(
              (certificationId) =>
                certificationRepo.create({
                  product_id: id,
                  certification_id: certificationId,
                  detected_from: 'manual',
                }),
            );
            await certificationRepo.save(newCertifications);
          }
        }

        return await this.getProductById(id);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        throw new Error(`Failed to update product: ${error.message}`);
      }
    });
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      const product = await this.productRepository.findOne({ where: { id } });

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      await this.productRepository.delete(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }

  private async getPreviousPeriodCount(
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
  ): Promise<number> {
    const previousPeriodEnd = new Date(currentPeriodStart);
    const previousPeriodStart = new Date(
      currentPeriodStart.getTime() -
        (currentPeriodEnd.getTime() - currentPeriodStart.getTime()),
    );

    return this.productRepository.count({
      where: {
        created_at: And(
          MoreThanOrEqual(previousPeriodStart),
          LessThanOrEqual(previousPeriodEnd),
        ),
      },
    });
  }
  private async getPreviousPeriodInStockCount(
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
  ): Promise<number> {
    const previousPeriodEnd = new Date(currentPeriodStart);
    const previousPeriodStart = new Date(
      currentPeriodStart.getTime() -
        (currentPeriodEnd.getTime() - currentPeriodStart.getTime()),
    );

    return this.productRepository.count({
      where: {
        created_at: And(
          MoreThanOrEqual(previousPeriodStart),
          LessThanOrEqual(previousPeriodEnd),
        ),
        variants: { availability: In([ProductAvailability.IN_STOCK]) },
      },
    });
  }

  private calculateTrendPercentage(current: number, previous: number): number {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
  }
}
