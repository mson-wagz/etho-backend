export interface ProductVariant {
  variantId: string;
  attributes: Record<string, string>; // e.g., { color: 'Red', size: 'M' }
  price: {
    now: string;
    original?: string;
  };
  availability: 'InStock' | 'OutOfStock' | 'PreOrder' | undefined;
  images?: string[];
  sku?: string;
  productPageUrl: string;
}

export interface ScrapedProduct {
  productPageUrl: string;
  productName: string;
  productDescription: string;
  productExtraDetails?: string;
  price: {
    now: string;
    original?: string;
  };
  images: string[];
  brandId: string;
  seller?: {
    name?: string;
    url?: string;
  };
  availability: 'InStock' | 'OutOfStock' | 'PreOrder' | undefined;
  condition?: 'New' | 'Used' | 'Refurbished' | 'Vintage' | undefined;
  category?: 'jewellery' | 'furniture' | undefined;
  productRawData: string;
  productEthicalRawData?: string;
  extractionMethod: 'schema-org' | 'custom-selectors';
  extractionConfidence: 'high' | 'medium' | 'low';
  scrapedAt: Date;
  variants?: ProductVariant[];
}

export interface UniformCrawlResult {
  siteUrl: string;
  batchId?: string;
  productData: ScrapedProduct[];
  siteEthicalRawData: string;
  startedAt: Date | undefined;
  finishedAt: Date | undefined;
  durationInSeconds: number;
}

export interface SiteMapConfig {
  url?: string;
  collectionUrlPattern?: string;
  productUrlPattern?: string;
}

export interface CollectionPageProductSelectors {
  singleProductLink?: string;
  hasPagination?: boolean;
  nextPageSelector?: string;
}

export interface ProductPriceSelector {
  original?: {
    price?: string;
    excludeSelectors?: string[];
  };
  now?: {
    price?: string;
    excludeSelectors?: string[];
  };
}

export interface ProductImageGallerySelector {
  selector?: string;
  imageLocationAttribute?: string;
}

export interface ProductSellerInfoSelector {
  name?: string;
  vendorSiteUrl?: string;
}

export enum EthicalDataLocation {
  PRODUCT_PAGE = 'product-page',
  ABOUT_PAGE = 'about-page',
  BOTH = 'both',
}

export interface EthicalDataConfig {
  location: EthicalDataLocation;
  aboutPageUrl?: string;
  selectors: {
    [EthicalDataLocation.PRODUCT_PAGE]?: string[];
    [EthicalDataLocation.ABOUT_PAGE]?: string[];
  };
}

export interface SingleProductPageSelectors {
  productName?: string;
  productDescription?: string;
  productExtraDetails?: string;
  productPrice?: ProductPriceSelector;
  productImageGallery?: ProductImageGallerySelector;
  sellerInfo?: ProductSellerInfoSelector;
}

export interface ScrapingTarget {
  id: string;
  url: string;
  collectionUrls?: string[];
  siteMapConfig?: SiteMapConfig;
  customSelectors?: {
    collectionPageProductSelectors?: CollectionPageProductSelectors;
    singleProductPageSelectors?: SingleProductPageSelectors;
  };
  ethicalDataConfig?: EthicalDataConfig;
  waitForMs?: number;
}

export interface CrawlJobData {
  brandName: string;
  brandId?: string;
  triggeredBy?: string;
  priority?: number;
  ingestionRunId?: string;
  ingestionMode?: 'full' | 'incremental';
}
