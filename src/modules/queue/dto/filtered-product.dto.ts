export interface FilteredProductPrice {
  amount: number;
  currency: string;
  compareAtPrice?: number;
}

export interface FilteredProductSeller {
  name?: string;
  url?: string;
  location?: string;
}

export type PrimaryFilter =
  | 'Fair Trade Practices'
  | 'Sustainable'
  | 'Cruelty-Free';

export type SecondaryFilter =
  | 'Clean Ingredients'
  | 'Gives Back'
  | 'Minority-Owned'
  | 'Woman-Owned'
  | 'Employee-Owned'
  | 'Family-Owned'
  | 'Small Business';

export interface EthicsTag {
  id: string;
  filter: PrimaryFilter | SecondaryFilter;
  confidence: number;
  percentage?: number;
  evidenceText: string[];
  source: string;
}

export interface FilteredProductCertification {
  id: string;
  name: string;
  certifyingBody?: string;
  detectedFrom: string;
}

export type ProductAvailabilityStatus = 'InStock' | 'OutOfStock' | 'PreOrder';

export interface FilteredProductVariant {
  price: FilteredProductPrice;
  images: string[];
  availability: ProductAvailabilityStatus;
  attributes?: Record<string, string>;
  productPageUrl?: string;
}

export interface FilteredProduct {
  id: string;
  url: string;
  title: string;
  description: string;
  shortDescription: string;
  variants: FilteredProductVariant[];
  brandId: string;
  seller: FilteredProductSeller;
  category_id: string;
  materials?: string[];
  ethicsTags: EthicsTag[];
  certifications: FilteredProductCertification[];
  badgeSummary: string;
  filterConfidence: number;
  manualReviewRequired: boolean;
  filteredAt: string | Date;
  scrapedAt: string | Date;
}

export interface ProcessedProductResult {
  success: boolean;
  productId?: string;
  action: 'created' | 'updated' | 'skipped' | 'error';
  error?: string;
  filteredProductId: string;
}

export interface ProcessingStats {
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  startedAt: Date;
  completedAt?: Date;
}
