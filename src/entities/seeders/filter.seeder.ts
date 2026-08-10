import { Seeder } from 'nestjs-seeder';
import { Injectable } from '@nestjs/common';
import { FilterRepository } from '../../repository/filter.repository';
import { FilterKeywordRepository } from '../../repository/filter-keyword.repository';
import { FilterTier } from '../../entities/filter.entity';

@Injectable()
export class FilterSeeder implements Seeder {
  constructor(
    private readonly filterRepository: FilterRepository,
    private readonly filterKeywordRepository: FilterKeywordRepository,
  ) {}

  async seed(): Promise<any> {
    const filters = [
      {
        name: 'Fair Trade Practices',
        slug: 'fair-trade-practices',
        tier: FilterTier.PRIMARY,
        keywords:
          'Living Wages, Employs Marginalized Groups, USA Made, Safe Working Conditions, No Child or Forced Labor, Culturally Sustaining / Indigenous-Owned or Partnered, Education / Skills Training',
        description:
          'Fair Trade sellers and products have been independently verified by recognized organizations to ensure fair pay, safe working conditions, and environmentally responsible practices throughout the supply chain.',
        priority: 1,
      },
      {
        name: 'Sustainable',
        slug: 'sustainable',
        tier: FilterTier.PRIMARY,
        keywords:
          'Sustainability & Environmental Impact, Environmental Responsibility, Organic, Sustainable Sourcing, Materials & Waste, Plastic Free / Recycled Plastics, Zero Waste, Regenerative, Second Hand / Circular / Upcycled, Handcrafted, Sustainable Packaging, Biodegradable, Energy & Emissions, Renewable Energy & Emission Reduction, Emission Reduction, Carbon Neutral / Climate Positive, Toxins & Ecosystems, Non-Toxic & Natural Materials, Non-Toxic Chemicals, Protects Biodiversity, Water Stewardship',
        description:
          'Products or brands that minimize environmental impact via responsible materials, cleaner energy, waste reduction, and protective resource use across sourcing, manufacturing, and packaging.',
        priority: 2,
      },
      {
        name: 'Cruelty-Free',
        slug: 'cruelty-free',
        tier: FilterTier.PRIMARY,
        keywords: 'No animals were harmed in the production process',
        description:
          'Products are not tested on animals at any stage of development or production; any animal-derived inputs are obtained humanely.',
        priority: 3,
      },

      {
        name: 'Clean Ingredients',
        slug: 'clean-ingredients',
        tier: FilterTier.SECONDARY,
        keywords:
          'Hypoallergenic, Sensitive-Skin Safe, Clean Beauty, Chemical-Free / Non-Toxic, Palm Oil–Free, Non-GMO, Small batch, Artisan Made, Vegan',
        description:
          'Formulated with safe, non-toxic inputs that avoid chemicals of concern and prioritize skin/health compatibility without sacrificing performance.',
        priority: 1,
      },
      {
        name: 'Gives Back',
        slug: 'gives-back',
        tier: FilterTier.SECONDARY,
        keywords:
          'Charitable, Community Empowerment, Social Impact, Non-profit',
        description:
          'Brands that contribute money, time, or resources to causes aligned with their mission.',
        priority: 2,
      },
      {
        name: 'Minority-Owned',
        slug: 'minority-owned',
        tier: FilterTier.SECONDARY,
        keywords:
          'Black-Owned, AAPI/South Asian-Owned, LGBTQ+ / Non-Binary-Owned, Latinx / Hispanic-Owned, Indigenous / Native-Owned, Middle Eastern / North African-Owned (MENA), Disability-Owned, Veteran-Owned',
        description:
          'Brands majority-owned (51%+) and controlled by individuals from underrepresented or historically marginalized communities.',
        priority: 3,
      },
      {
        name: 'Woman-Owned',
        slug: 'woman-owned',
        tier: FilterTier.SECONDARY,
        keywords: 'Woman-Owned',
        description:
          'At least 51% owned, controlled, and operated by one or more women.',
        priority: 4,
      },
      {
        name: 'Employee-Owned',
        slug: 'employee-owned',
        tier: FilterTier.SECONDARY,
        keywords: 'Employee-Owned, ESOP, Worker Cooperative',
        description:
          'Employees hold a majority ownership stake (e.g., ESOP, worker cooperative), sharing profits and governance.',
        priority: 5,
      },
      {
        name: 'Small Business',
        slug: 'small-business',
        tier: FilterTier.SECONDARY,
        keywords: 'Small Business, Independently Owned',
        description:
          'Independently owned and operated on a small scale; emphasizes craftsmanship, service, and local economic impact.',
        priority: 6,
      },
    ];

    for (const filterData of filters) {
      const existing = await this.filterRepository.findOne({
        where: { slug: filterData.slug },
      });
      if (!existing) {
        const { keywords, ...filterWithoutKeywords } = filterData;
        const filter = this.filterRepository.create(filterWithoutKeywords);
        await this.filterRepository.save(filter);

        const keywordStrings = keywords.split(',').map((k) => k.trim());
        for (const keywordString of keywordStrings) {
          const keyword = this.filterKeywordRepository.create({
            filter_id: filter.id,
            keyword: keywordString,
          });
          await this.filterKeywordRepository.save(keyword);
        }
      }
    }
  }

  async drop(): Promise<any> {
    const filters = await this.filterRepository.find();
    for (const filter of filters) {
      await this.filterRepository.remove(filter);
    }
  }
}
