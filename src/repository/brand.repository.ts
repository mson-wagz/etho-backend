import { Injectable } from '@nestjs/common';
import { DataSource, Like, Repository } from 'typeorm';
import { Brand } from '../entities/brand.entity';

@Injectable()
export class BrandRepository extends Repository<Brand> {
  constructor(private dataSource: DataSource) {
    super(Brand, dataSource.createEntityManager());
  }

  async findByName(name: string): Promise<Brand | null> {
    return this.findOne({ where: { name } });
  }

  async findByWebsiteUrl(url: string): Promise<Brand | null> {
    return this.findOne({ where: { website_url: Like(`%${url}%`) } });
  }

  async findOrCreate(name: string, websiteUrl: string): Promise<Brand> {
    let brand = await this.findByName(name);
    if (!brand) {
      brand = this.create({
        name,
        website_url: websiteUrl,
        scrape_status: 'active',
      });
      brand = await this.save(brand);
    }
    return brand;
  }
}
