export const brands = [
  {
    name: 'armadillo-co.com',
    website_url: 'https://www.armadillo-co.com',
    description: 'This is the armadillo-co.com brand',
    scrapingSourceConfig: {
      id: 'armadillo',
      url: 'https://www.armadillo-co.com',
      siteMapConfig: {
        url: 'https://www.armadillo-co.com/sitemap.xml',
        collectionUrlPattern: '/shop-all/',
      },
      customSelectors: {
        collectionPageProductSelectors: {
          singleProductLink: 'section div article > a',
        },
        singleProductPageSelectors: {
          productName: 'div#product-container section div div h1',
          productDescription: 'div#product-container section div.go46053904',
          productExtraDetails: 'div#product-container section div.go4009087169',
          sellerInfo: {
            name: 'armadillo',
          },
          productPrice: {
            original: {
              price: [
                'div#product-container div.is-caption span > span > span > span:nth-child(1)',
              ],
            },
            now: {
              price: [
                'div#product-container div.is-caption span > span > span > span:nth-child(2)',
                'div#product-container div.is-caption span > span',
              ],
            },
          },
          productImageGallery: {
            selector:
              'div#product-container section div button div picture source',
            imageLocationAttribute: 'srcset',
          },
        },
      },
      ethicalDataConfig: {
        location: 'about-page',
        aboutPageUrl: 'https://armadillo-co.com/about',
        selectors: {
          'about-page': ['div#__next'],
        },
      },
      waitForMs: 8000,
    },
  },
  {
    name: 'the-citizenry.com',
    website_url: 'https://www.the-citizenry.com',
    description: 'This is the the-citizenry.com brand',
    scrapingSourceConfig: {
      id: 'citizenry',
      url: 'https://www.the-citizenry.com',
      siteMapConfig: {
        url: 'https://www.the-citizenry.com/sitemap.xml',
        collectionUrlPattern: '/collections/',
      },
      customSelectors: {
        collectionPageProductSelectors: {
          singleProductLink: 'a.tc-product-list__title',
        },
        singleProductPageSelectors: {
          productName: 'h1.tc-product-form__header',
          productDescription:
            'div.tc-product__description.tc-product__description--default p',
          productExtraDetails:
            'div.tc-pdp-accordion.js-product-accordion.js-product-details-accordion',
          sellerInfo: {
            name: 'div.tc-pdp-accordion.js-product-accordion h3.tc-p-lg',
            vendorSiteUrl:
              'div.tc-pdp-accordion.js-product-accordion a.main-pdp_artisan-learn-more',
          },
          productPrice: {
            original: {
              price: ['s.PDPHighlights__price--old-price'],
            },
            now: {
              price: [
                'span.PDPHighlights__price--sale-price',
                'span.PDPHighlights__price__text',
              ],
            },
          },
          productImageGallery: {
            selector: 'div.stage-wrap.js-sliderImg img',
            imageLocationAttribute: 'src',
          },
        },
      },
      ethicalDataConfig: {
        location: 'both',
        aboutPageUrl: 'https://www.the-citizenry.com/pages/about',
        selectors: {
          'about-page': ['div.LandingPage.js-landingPage'],
          'product-page': [
            'ul.PDPCertificates li.PDPCertificates__cert div.PDPCertificates__cert__text-wrapper div.PDPCertificates__cert__title',
            'p.tc-product__giveback',
          ],
        },
      },
      waitForMs: 5000,
    },
  },
  {
    name: 'reve-en-vert.com',
    website_url: 'https://reve-en-vert.com',
    description: 'This is the reve-en-vert.com brand',
    scrapingSourceConfig: {
      id: 'reve-en-vert',
      url: 'https://reve-en-vert.com',
      siteMapConfig: {
        url: 'https://reve-en-vert.com/sitemap.xml',
        collectionUrlPattern: '/product-category/',
      },
      customSelectors: {
        collectionPageProductSelectors: {
          singleProductLink: 'div.product.type-product > a',
          hasPagination: true,
          nextPageSelector: 'nav.rev-pagination-list a.next.page-numbers',
        },
        singleProductPageSelectors: {
          productName: 'div.product-summary-info__title-price-wrapper h1',
          productDescription:
            'div.product-summary-info-main__bottom div.product-summary-info__description p',
          productExtraDetails: 'div.product-summary-info-main',
          sellerInfo: {
            name: 'Reve-en-vert',
          },
          productPrice: {
            original: {
              price: {
                amount:
                  'div.product-summary-info__title-price-wrapper h3 del span.wmc-wc-price span.woocommerce-Price-amount.amount bdi',
                currency:
                  'div.product-summary-info__title-price-wrapper h3 del span.wmc-wc-price span.woocommerce-Price-amount.amount bdi span.woocommerce-Price-currencySymbol',
              },
            },
            now: {
              price: {
                amount:
                  'div.product-summary-info__title-price-wrapper h3 span.wmc-wc-price span.woocommerce-Price-amount.amount bdi',
                currency:
                  'div.product-summary-info__title-price-wrapper h3 span.wmc-wc-price span.woocommerce-Price-amount.amount bdi span.woocommerce-Price-currencySymbol',
              },
              excludeSelectors: [
                'div.product-summary-info__title-price-wrapper h3 del',
              ],
            },
          },
          productImageGallery: {
            selector:
              'div.swiper-container.gallery-top div.swiper-wrapper div.swiper-slide',
            imageLocationAttribute: 'data-bg-image',
          },
        },
      },
      ethicalDataConfig: {
        location: 'both',
        aboutPageUrl: 'https://reve-en-vert.com/ethos',
        selectors: {
          'about-page': ['main.site-main'],
          'product-page': [
            'div.product-summary-info__sustainability div.sustainability-wrapper div.sustainable-wrapper > p',
          ],
        },
      },
    },
  },
];
