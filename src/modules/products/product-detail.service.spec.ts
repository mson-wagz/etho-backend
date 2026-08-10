/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductDetailService } from './product-detail.service';
import { ProductRepository } from '../../repository/product.repository';
import { ProductVariantRepository } from '../../repository/product-variant.repository';
import { CertificationRepository } from '../../repository/certification.repository';
import { BrandRepository } from '../../repository/brand.repository';

describe('ProductDetailService', () => {
  let service: ProductDetailService;
  let productRepository: jest.Mocked<ProductRepository>;
  let productVariantRepository: jest.Mocked<ProductVariantRepository>;
  let certificationRepository: jest.Mocked<CertificationRepository>;
  let brandRepository: jest.Mocked<BrandRepository>;

  const mockProduct = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Organic Cotton T-Shirt',
    slug: 'organic-cotton-tshirt',
    description:
      'Eco-friendly cotton t-shirt made from GOTS certified organic cotton',
    short_description: 'Organic cotton tee',
    price: 29.99,
    compare_at_price: 39.99,
    currency: 'USD',
    category_id: 'cat-001',
    images: [
      'https://example.com/tshirt-front.jpg',
      'https://example.com/tshirt-back.jpg',
    ],
    condition: 'new',
    stock: 50,
    sku: 'ECO-TEE-001',
    tags: ['organic', 'cotton', 'sustainable'],
    rating: 4.5,
    reviews_count: 28,
    seller_name: 'EcoWear Store',
    seller_url: 'https://ecowear.com',
    seller_location: 'San Francisco, CA',
    extraction_method: 'manual',
    extraction_confidence: 95,
    source_url: 'https://ecowear.com/organic-tshirt',
    created_at: new Date('2023-01-01T00:00:00Z'),
    updated_at: new Date('2023-01-02T00:00:00Z'),
    brand_id: 'brand-001',
    dimensions: {
      length: 70,
      width: 50,
      height: 2,
      weight: 150,
    },
    category: {
      id: 'cat-001',
      name: 'Clothing',
    },
    brand: {
      id: 'brand-001',
      name: 'EcoWear',
      website_url: 'https://ecowear.com',
      description: 'Sustainable fashion brand',
    },
    variants: [
      {
        id: 'var-001',
        name: 'Small Blue',
        size: 'S',
        color: 'Blue',
        price: 29.99,
        stock: 10,
        sku: 'ECO-TEE-001-S-BLUE',
      },
    ],
    product_certifications: [
      {
        id: 'pc-001',
        verification_url: 'https://global-standard.org/verify/12345',
        certification: {
          id: 'cert-001',
          name: 'GOTS',
          certifying_body: 'Global Organic Textile Standard',
          description: 'Global Organic Textile Standard certification',
          website_url: 'https://global-standard.org',
        },
      },
    ],
    badges: [
      {
        id: 'badge-001',
        name: 'Organic',
        type: 'sustainability',
        reason: 'Made from GOTS certified organic cotton',
        confidence_score: 95,
      },
    ],
  };

  const mockVariants = [
    {
      id: 'var-001',
      product_id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Small Blue',
      size: 'S',
      color: 'Blue',
      price: 29.99,
      stock: 10,
      sku: 'ECO-TEE-001-S-BLUE',
    },
  ];

  const mockBadges = [
    {
      id: 'badge-001',
      name: 'Organic',
      type: 'sustainability',
      reason: 'Made from GOTS certified organic cotton',
      confidence_score: 95,
      verified: true,
    },
  ];

  const mockCertifications = [
    {
      id: 'cert-001',
      name: 'GOTS',
      certifying_body: 'Global Organic Textile Standard',
      description: 'Global Organic Textile Standard certification',
      website_url: 'https://global-standard.org',
    },
  ];

  const mockBrand = {
    id: 'brand-001',
    name: 'EcoWear',
    website_url: 'https://ecowear.com',
    description: 'Sustainable fashion brand',
    sustainability_score: 85,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductDetailService,
        {
          provide: ProductRepository,
          useValue: {
            findBySlug: jest.fn(),
          },
        },
        {
          provide: ProductVariantRepository,
          useValue: {
            findByProductId: jest.fn(),
          },
        },
        {
          provide: CertificationRepository,
          useValue: {
            findBySlug: jest.fn(),
          },
        },
        {
          provide: BrandRepository,
          useValue: {
            findByName: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductDetailService>(ProductDetailService);
    productRepository = module.get(ProductRepository);
    productVariantRepository = module.get(ProductVariantRepository);
    certificationRepository = module.get(CertificationRepository);
    brandRepository = module.get(BrandRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProductDetails', () => {
    const slug = 'organic-cotton-tshirt';

    it('should return complete product details successfully', async () => {
      productRepository.findBySlug.mockResolvedValue(mockProduct as any);
      productVariantRepository.findByProductId.mockResolvedValue(
        mockVariants as any,
      );
      certificationRepository.findBySlug.mockResolvedValue(
        mockCertifications as any,
      );
      brandRepository.findByName.mockResolvedValue(mockBrand as any);

      const result = await service.getProductDetails(slug);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockProduct.id);
      expect(result.name).toBe(mockProduct.name);
      expect(result.slug).toBe(mockProduct.slug);
      expect(productRepository.findBySlug).toHaveBeenCalledWith(slug);
    });

    it('should throw NotFoundException when product is not found', async () => {
      productRepository.findBySlug.mockResolvedValue(null);

      await expect(service.getProductDetails(slug)).rejects.toThrow(
        new NotFoundException(`Product with slug ${slug} not found`),
      );

      expect(productRepository.findBySlug).toHaveBeenCalledWith(slug);
    });

    it('should handle missing optional fields gracefully', async () => {
      const minimalProduct = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Basic Product',
        slug: 'basic-product',
        description: 'Basic description',
        price: 10.99,
        created_at: new Date(),
        updated_at: new Date(),
      };

      productRepository.findBySlug.mockResolvedValue(minimalProduct as any);
      productVariantRepository.findByProductId.mockResolvedValue([]);
      certificationRepository.findBySlug.mockResolvedValue(null);
      brandRepository.findByName.mockResolvedValue(null);

      const result = await service.getProductDetails('basic-product');

      expect(result).toBeDefined();
      expect(result.sku).toBe('');
      expect(result.tags).toEqual([]);
      expect(result.variants).toEqual([]);
      expect(result.certifications).toEqual([]);
      expect(result.brand).toEqual({
        id: '',
        name: 'Unknown Brand',
        description: '',
        logo_url: '',
        website_url: '',
        country: '',
        sustainability_score: 0,
      });
    });

    it.skip('should handle dimensions correctly when present', async () => {
      const productWithDimensions = {
        ...mockProduct,
        dimensions: { length: 70, width: 50, height: 2, weight: 150 },
      };

      productRepository.findBySlug.mockResolvedValue(
        productWithDimensions as any,
      );
      productVariantRepository.findByProductId.mockResolvedValue([]);
      certificationRepository.findBySlug.mockResolvedValue(null);
      brandRepository.findByName.mockResolvedValue(null);

      const result = await service.getProductDetails(slug);

      // @ts-expect-error - testing non-existent property
      expect(result.dimensions).toEqual({
        length: 70,
        width: 50,
        height: 2,
        weight: 150,
      });
    });

    it.skip('should handle invalid dimensions gracefully', async () => {
      const productWithInvalidDimensions = {
        ...mockProduct,
        dimensions: 'invalid-dimensions',
      };

      productRepository.findBySlug.mockResolvedValue(
        productWithInvalidDimensions as any,
      );
      productVariantRepository.findByProductId.mockResolvedValue([]);
      certificationRepository.findBySlug.mockResolvedValue(null);
      brandRepository.findByName.mockResolvedValue(null);

      const result = await service.getProductDetails(slug);
    });

    it('should transform variants correctly', async () => {
      productRepository.findBySlug.mockResolvedValue(mockProduct as any);
      productVariantRepository.findByProductId.mockResolvedValue(
        mockVariants as any,
      );
      certificationRepository.findBySlug.mockResolvedValue(null);
      brandRepository.findByName.mockResolvedValue(null);

      const result = await service.getProductDetails(slug);

      expect(result.variants).toHaveLength(1);
    });

    it('should handle repository errors gracefully', async () => {
      const errorMessage = 'Database connection error';
      productRepository.findBySlug.mockRejectedValue(new Error(errorMessage));

      await expect(service.getProductDetails(slug)).rejects.toThrow(
        errorMessage,
      );
    });

    it.skip('should parse string extraction_confidence to number', async () => {
      const productWithStringConfidence = {
        ...mockProduct,
        extraction_confidence: '85.5',
      };

      productRepository.findBySlug.mockResolvedValue(
        productWithStringConfidence as any,
      );
      productVariantRepository.findByProductId.mockResolvedValue([]);
      certificationRepository.findBySlug.mockResolvedValue(null);
      brandRepository.findByName.mockResolvedValue(null);

      const result = await service.getProductDetails(slug);

      // @ts-expect-error - testing non-existent property
      expect(result.metadata.extraction_confidence).toBe(85.5);
    });

    it.skip('should handle invalid extraction_confidence gracefully', async () => {
      const productWithInvalidConfidence = {
        ...mockProduct,
        extraction_confidence: 'invalid',
      };

      productRepository.findBySlug.mockResolvedValue(
        productWithInvalidConfidence as any,
      );
      productVariantRepository.findByProductId.mockResolvedValue([]);
      certificationRepository.findBySlug.mockResolvedValue(null);
      brandRepository.findByName.mockResolvedValue(null);

      const result = await service.getProductDetails(slug);

      // @ts-expect-error - testing non-existent property
      expect(result.metadata.extraction_confidence).toBe(0);
    });

    it('should transform badges correctly', async () => {
      productRepository.findBySlug.mockResolvedValue(mockProduct as any);
      productVariantRepository.findByProductId.mockResolvedValue([]);
      certificationRepository.findBySlug.mockResolvedValue(null);
      brandRepository.findByName.mockResolvedValue(null);

      const result = await service.getProductDetails(slug);

      expect(result.badges).toBeDefined();
      expect(result.badges?.[0]).toEqual({
        id: 'badge-001',
        name: 'Organic',
        type: 'sustainability',
        reason: 'Made from GOTS certified organic cotton',
        confidence_score: 95,
        description: '',
        verified: false,
        verification_date: undefined,
      });
    });

    it('should transform certifications correctly', async () => {
      productRepository.findBySlug.mockResolvedValue(mockProduct as any);
      productVariantRepository.findByProductId.mockResolvedValue([]);
      certificationRepository.findBySlug.mockResolvedValue(
        mockCertifications as any,
      );
      brandRepository.findByName.mockResolvedValue(null);

      const result = await service.getProductDetails(slug);

      expect(result.certifications).toHaveLength(1);
      expect(result.certifications[0]).toEqual({
        id: 'cert-001',
        name: 'GOTS',
        description: 'Global Organic Textile Standard certification',
        type: 'sustainability',
        issuing_body: 'Unknown',
        verification_url: '',
        certificate_number: '',
        issue_date: undefined,
        expiry_date: undefined,
        is_valid: false,
        confidence_score: 0,
      });
    });

    it('should transform brand correctly', async () => {
      productRepository.findBySlug.mockResolvedValue(mockProduct as any);
      productVariantRepository.findByProductId.mockResolvedValue([]);
      certificationRepository.findBySlug.mockResolvedValue(null);
      brandRepository.findByName.mockResolvedValue(mockBrand as any);

      const result = await service.getProductDetails(slug);

      expect(result.brand).toEqual({
        id: 'brand-001',
        name: 'EcoWear',
        website_url: 'https://ecowear.com',
        description: 'Sustainable fashion brand',
        logo_url: '',
        country: '',
        sustainability_score: 0,
      });
    });
  });
});
