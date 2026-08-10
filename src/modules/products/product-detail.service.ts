import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from '../../repository/product.repository';
import {
  ProductDetailResponseDto,
  ProductBrandDto,
  ProductCertificationDto,
} from './dto/product-detail-response.dto';
import { ProductResponse } from './dto/product-response.dto';

@Injectable()
export class ProductDetailService {
  constructor(private readonly productRepository: ProductRepository) {}

  async getProductDetails(slug: string): Promise<ProductDetailResponseDto> {
    const startTime = Date.now();

    try {
      const product = await this.productRepository.findBySlug(slug);

      if (!product) {
        throw new NotFoundException(`Product with slug ${slug} not found`);
      }

      const queryTime = Date.now() - startTime;

      const response: ProductDetailResponseDto = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        category: {
          id: product.category_id,
          name: product.category?.name || 'Uncategorized',
          slug: product.category?.slug || '',
        },
        materials: product.materials,
        variants: product.variants as any,
        certifications: this.transformCertifications(
          product.product_certifications || [],
        ),
        badges: product.product_filters.map((pf) => {
          const filter = pf.filter;
          return {
            id: filter?.id || pf.filter_id,
            name: filter?.name || '',
            description: filter?.description || '',
            slug: filter?.slug || '',
            evidence_text: pf.evidence_text?.join(', ') || '',
          };
        }),
        brand: this.transformBrand(product.brand),
        sourceUrl: product.source_url,
      };

      if (queryTime > 300) {
        console.warn(`Slow query detected: ${queryTime}ms for product ${slug}`);
      }
      return response;
    } catch (error: any) {
      console.error(`Error fetching product details for ${slug}:`, error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new Error(`Failed to fetch product details: ${error.message}`);
    }
  }

  private transformCertifications(
    productCertifications: any[],
  ): ProductCertificationDto[] {
    return productCertifications.map((pc) => {
      const certification = pc.certification;
      return {
        id: certification?.id || pc.certification_id,
        name: certification?.name || '',
        slug: certification?.slug || '',
        certifying_body: certification?.certifying_body || '',
        description: certification?.description,
        icon_url: certification?.icon_url,
        website_url: certification?.website_url,
        verification_url: pc.verification_url,
      };
    });
  }

  private transformBrand(brand: any): ProductBrandDto {
    if (!brand) {
      return {
        id: '',
        name: 'Unknown Brand',
        website_url: '',
        description: '',
      };
    }

    return {
      id: brand.id,
      name: brand.name,
      website_url: brand.website_url || '',
      description: brand.description,
    };
  }

  async getRelatedProducts(
    productId: string,
    limit: number,
  ): Promise<ProductResponse[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      select: ['id', 'category_id', 'brand_id'],
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    const related = await this.productRepository.findRelatedProducts(
      productId,
      product.category_id,
      product.brand_id,
      limit,
    );

    return related.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: {
        id: p.category_id,
        name: p.category?.name || '',
        slug: p.category?.slug || '',
      },
      materials: p.materials || [],
      variants: p.variants as any,
      slug: p.slug,
      sourceUrl: p.source_url,
      badges: p.product_filters?.map((pf) => pf.filter) || [],
      brand: p.brand ? { id: p.brand.id, name: p.brand.name } : null,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  }
}
