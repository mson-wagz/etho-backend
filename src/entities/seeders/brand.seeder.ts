import { Seeder } from 'nestjs-seeder';
import { Injectable } from '@nestjs/common';
import { BrandRepository } from '../../repository/brand.repository';
import { ScrapingSourceRepository } from '../../repository/scraping-source.repository';
import { brands } from '../../common/constants/seedData';

@Injectable()
export class BrandSeeder implements Seeder {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly scrapingSourceRepository: ScrapingSourceRepository,
  ) {}

  async seed(): Promise<any> {
    for (const brandData of brands) {
      const existing = await this.brandRepository.findOne({
        where: { name: brandData.name },
      });

      if (!existing) {
        // Create and save the brand
        const brand = this.brandRepository.create({
          name: brandData.name,
          website_url: brandData.website_url,
          description: brandData.description,
        });
        const savedBrand = await this.brandRepository.save(brand);

        if (brandData.scrapingSourceConfig) {
          const scrapingSource = this.scrapingSourceRepository.create({
            brand_id: savedBrand.id,
            config: brandData.scrapingSourceConfig,
            is_active: true,
          });
          await this.scrapingSourceRepository.save(scrapingSource);
        }
      }
    }
  }

  async drop(): Promise<any> {
    // Delete all records manually to avoid FK constraint issues
    const scrapingSources = await this.scrapingSourceRepository.find();
    for (const source of scrapingSources) {
      await this.scrapingSourceRepository.remove(source);
    }

    const brands = await this.brandRepository.find();
    for (const brand of brands) {
      await this.brandRepository.remove(brand);
    }
  }
}
