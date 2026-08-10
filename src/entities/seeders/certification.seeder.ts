import { Seeder } from 'nestjs-seeder';
import { Injectable } from '@nestjs/common';
import { CertificationRepository } from '../../repository/certification.repository';
import { FilterRepository } from '../../repository/filter.repository';

@Injectable()
export class CertificationSeeder implements Seeder {
  constructor(
    private readonly certificationRepository: CertificationRepository,
    private readonly filterRepository: FilterRepository,
  ) {}

  async seed(): Promise<any> {
    const fairTradeFilter = await this.filterRepository.findOne({
      where: { slug: 'fair-trade-practices' },
    });
    const sustainableFilter = await this.filterRepository.findOne({
      where: { slug: 'sustainable' },
    });
    const crueltyFreeFilter = await this.filterRepository.findOne({
      where: { slug: 'cruelty-free' },
    });
    const cleanIngredientsFilter = await this.filterRepository.findOne({
      where: { slug: 'clean-ingredients' },
    });
    const givesBackFilter = await this.filterRepository.findOne({
      where: { slug: 'gives-back' },
    });
    const minorityOwnedFilter = await this.filterRepository.findOne({
      where: { slug: 'minority-owned' },
    });
    const womanOwnedFilter = await this.filterRepository.findOne({
      where: { slug: 'woman-owned' },
    });
    const employeeOwnedFilter = await this.filterRepository.findOne({
      where: { slug: 'employee-owned' },
    });
    const smallBusinessFilter = await this.filterRepository.findOne({
      where: { slug: 'small-business' },
    });

    const certifications = [
      // Fair Trade Practices Certifications
      {
        filter_id: fairTradeFilter?.id,
        name: 'World Fair Trade Organization (WFTO)',
        slug: 'wfto',
        certifying_body: 'WFTO',
        description:
          'This is the World Fair Trade Organization (WFTO) certification',
      },
      {
        filter_id: fairTradeFilter?.id,
        name: 'Fair Trade Federation',
        slug: 'fair-trade-federation',
        certifying_body: 'Fair Trade Federation',
        description: 'This is the Fair Trade Federation certification',
      },
      {
        filter_id: fairTradeFilter?.id,
        name: 'Fairtrade International / Fairtrade Mark',
        slug: 'fairtrade-international',
        certifying_body: 'Fairtrade International (FLO-Cert)',
        description:
          'This is the Fairtrade International / Fairtrade Mark certification',
      },
      {
        filter_id: fairTradeFilter?.id,
        name: 'Fair Trade USA',
        slug: 'fair-trade-usa',
        certifying_body: 'Fair Trade USA',
        description: 'This is the Fair Trade USA certification',
      },
      {
        filter_id: fairTradeFilter?.id,
        name: 'Fair Trade India Label',
        slug: 'fair-trade-india-label',
        certifying_body: 'Fair Trade India Forum',
        description: 'This is the Fair Trade India Label certification',
      },
      {
        filter_id: fairTradeFilter?.id,
        name: 'Fair for Life',
        slug: 'fair-for-life',
        certifying_body: 'Ecocert',
        description: 'This is the Fair for Life certification',
      },
      {
        filter_id: fairTradeFilter?.id,
        name: 'Fairmined Gold',
        slug: 'fairmined-gold',
        certifying_body: 'Alliance for Responsible Mining',
        description: 'This is the Fairmined Gold certification',
      },
      {
        filter_id: fairTradeFilter?.id,
        name: 'FairWild',
        slug: 'fairwild',
        certifying_body: 'FairWild Foundation',
        description: 'This is the FairWild certification',
      },
      {
        filter_id: fairTradeFilter?.id,
        name: 'GoodWeave',
        slug: 'goodweave',
        certifying_body: 'GoodWeave International',
        description: 'This is the GoodWeave certification',
      },
      {
        filter_id: fairTradeFilter?.id,
        name: 'SA8000',
        slug: 'sa8000',
        certifying_body: 'Social Accountability International',
        description: 'This is the SA8000 certification',
      },
      {
        filter_id: fairTradeFilter?.id,
        name: 'WRAP',
        slug: 'wrap',
        certifying_body: 'Worldwide Responsible Accredited Production',
        description: 'This is the WRAP certification',
      },
      {
        filter_id: fairTradeFilter?.id,
        name: 'Fair Wear Foundation',
        slug: 'fair-wear-foundation',
        certifying_body: 'Fair Wear Foundation',
        description: 'This is the Fair Wear Foundation certification',
      },
      {
        filter_id: fairTradeFilter?.id,
        name: 'SEDEX / SMETA',
        slug: 'sedex-smeta',
        certifying_body: 'Sedex Global',
        description: 'This is the SEDEX / SMETA certification',
      },
      {
        filter_id: fairTradeFilter?.id,
        name: 'Amfori BSCI',
        slug: 'amfori-bsci',
        certifying_body: 'Amfori',
        description: 'This is the Amfori BSCI certification',
      },
      {
        filter_id: fairTradeFilter?.id,
        name: 'ICS Ethical Audits',
        slug: 'ics-ethical-audits',
        certifying_body: 'ICS',
        description: 'This is the ICS Ethical Audits certification',
      },

      // Sustainable Certifications
      {
        filter_id: sustainableFilter?.id,
        name: 'Green Seal',
        slug: 'green-seal',
        certifying_body: 'Green Seal',
        description: 'This is the Green Seal certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'EU Ecolabel',
        slug: 'eu-ecolabel',
        certifying_body: 'European Commission',
        description: 'This is the EU Ecolabel certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'Nordic Swan Ecolabel',
        slug: 'nordic-swan-ecolabel',
        certifying_body: 'Nordic Ecolabelling',
        description: 'This is the Nordic Swan Ecolabel certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'Blue Angel',
        slug: 'blue-angel',
        certifying_body: 'German Federal Government',
        description: 'This is the Blue Angel certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'Cradle to Cradle Certified',
        slug: 'cradle-to-cradle-certified',
        certifying_body: 'C2CPII',
        description: 'This is the Cradle to Cradle Certified certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'Rainforest Alliance/UTZ Certified',
        slug: 'rainforest-alliance-utz',
        certifying_body: 'UTZ / Rainforest Alliance',
        description:
          'This is the Rainforest Alliance/UTZ Certified certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'Regenerative Organic Certified (ROC)',
        slug: 'regenerative-organic-certified',
        certifying_body: 'Regenerative Organic Alliance',
        description:
          'This is the Regenerative Organic Certified (ROC) certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'Land to Market',
        slug: 'land-to-market',
        certifying_body: 'Savory Institute',
        description: 'This is the Land to Market certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'Aquaculture Stewardship Council (ASC)',
        slug: 'asc',
        certifying_body: 'ASC',
        description:
          'This is the Aquaculture Stewardship Council (ASC) certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'Marine Stewardship Council (MSC)',
        slug: 'msc',
        certifying_body: 'MSC',
        description:
          'This is the Marine Stewardship Council (MSC) certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'Alliance for Water Stewardship',
        slug: 'alliance-water-stewardship',
        certifying_body: 'AWS',
        description: 'This is the Alliance for Water Stewardship certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'Global Recycled Standard',
        slug: 'global-recycled-standard',
        certifying_body: 'Textile Exchange',
        description: 'This is the Global Recycled Standard certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'Recycled Claim Standard',
        slug: 'recycled-claim-standard',
        certifying_body: 'Textile Exchange',
        description: 'This is the Recycled Claim Standard certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'TRUE Zero Waste',
        slug: 'true-zero-waste',
        certifying_body: 'GBCI',
        description: 'This is the TRUE Zero Waste certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'FSC',
        slug: 'fsc',
        certifying_body: 'Forest Stewardship Council',
        description: 'This is the FSC certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'Carbon Trust Standard',
        slug: 'carbon-trust-standard',
        certifying_body: 'Carbon Trust',
        description: 'This is the Carbon Trust Standard certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'PAS 2060',
        slug: 'pas-2060',
        certifying_body: 'BSI',
        description: 'This is the PAS 2060 certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'RE100',
        slug: 're100',
        certifying_body: 'The Climate Group / CDP',
        description: 'This is the RE100 certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'Green-e',
        slug: 'green-e',
        certifying_body: 'Center for Resource Solutions',
        description: 'This is the Green-e certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'LEED',
        slug: 'leed',
        certifying_body: 'USGBC',
        description: 'This is the LEED certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'OEKO-TEX Standard 100',
        slug: 'oeko-tex-standard-100',
        certifying_body: 'OEKO-TEX',
        description: 'This is the OEKO-TEX Standard 100 certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'OEKO-TEX MADE IN GREEN',
        slug: 'oeko-tex-made-in-green',
        certifying_body: 'OEKO-TEX',
        description: 'This is the OEKO-TEX MADE IN GREEN certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'OEKO-TEX Leather Standard',
        slug: 'oeko-tex-leather-standard',
        certifying_body: 'OEKO-TEX',
        description: 'This is the OEKO-TEX Leather Standard certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'Bluesign',
        slug: 'bluesign',
        certifying_body: 'Bluesign Technologies',
        description: 'This is the Bluesign certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'MADE SAFE',
        slug: 'made-safe',
        certifying_body: 'MADE SAFE',
        description: 'This is the MADE SAFE certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'Greenguard / Gold',
        slug: 'greenguard-gold',
        certifying_body: 'UL Environment',
        description: 'This is the Greenguard / Gold certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'EPA Safer Choice',
        slug: 'epa-safer-choice',
        certifying_body: 'EPA',
        description: 'This is the EPA Safer Choice certification',
      },
      {
        filter_id: sustainableFilter?.id,
        name: 'ZDHC',
        slug: 'zdhc',
        certifying_body: 'ZDHC Foundation',
        description: 'This is the ZDHC certification',
      },

      // Cruelty-Free Certifications
      {
        filter_id: crueltyFreeFilter?.id,
        name: 'Leaping Bunny',
        slug: 'leaping-bunny',
        certifying_body: 'CCIC',
        description: 'This is the Leaping Bunny certification',
      },
      {
        filter_id: crueltyFreeFilter?.id,
        name: 'PETA Cruelty-Free',
        slug: 'peta-cruelty-free',
        certifying_body: 'PETA',
        description: 'This is the PETA Cruelty-Free certification',
      },
      {
        filter_id: crueltyFreeFilter?.id,
        name: 'Choose Cruelty Free',
        slug: 'choose-cruelty-free',
        certifying_body: 'CCF (legacy)',
        description: 'This is the Choose Cruelty Free certification',
      },

      // Clean Ingredients Certifications
      {
        filter_id: cleanIngredientsFilter?.id,
        name: 'USDA Organic',
        slug: 'usda-organic',
        certifying_body: 'USDA',
        description: 'This is the USDA Organic certification',
      },
      {
        filter_id: cleanIngredientsFilter?.id,
        name: 'GOTS',
        slug: 'gots',
        certifying_body: 'GOTS',
        description: 'This is the GOTS certification',
      },
      {
        filter_id: cleanIngredientsFilter?.id,
        name: 'OCS',
        slug: 'ocs',
        certifying_body: 'Textile Exchange',
        description: 'This is the OCS certification',
      },
      {
        filter_id: cleanIngredientsFilter?.id,
        name: 'COSMOS',
        slug: 'cosmos',
        certifying_body: 'COSMOS-standard AISBL',
        description: 'This is the COSMOS certification',
      },
      {
        filter_id: cleanIngredientsFilter?.id,
        name: 'NATRUE',
        slug: 'natrue',
        certifying_body: 'NATRUE',
        description: 'This is the NATRUE certification',
      },
      {
        filter_id: cleanIngredientsFilter?.id,
        name: 'EWG VERIFIED',
        slug: 'ewg-verified',
        certifying_body: 'EWG',
        description: 'This is the EWG VERIFIED certification',
      },
      {
        filter_id: cleanIngredientsFilter?.id,
        name: 'NSF/ANSI 305',
        slug: 'nsf-ansi-305',
        certifying_body: 'NSF',
        description: 'This is the NSF/ANSI 305 certification',
      },
      {
        filter_id: cleanIngredientsFilter?.id,
        name: 'Non-GMO Project Verified',
        slug: 'non-gmo-project-verified',
        certifying_body: 'Non-GMO Project',
        description: 'This is the Non-GMO Project Verified certification',
      },
      {
        filter_id: cleanIngredientsFilter?.id,
        name: 'Palm Oil Free (POFCAP)',
        slug: 'palm-oil-free',
        certifying_body: 'POFCAP',
        description: 'This is the Palm Oil Free (POFCAP) certification',
      },
      {
        filter_id: cleanIngredientsFilter?.id,
        name: 'AllergyCertified',
        slug: 'allergy-certified',
        certifying_body: 'AllergyCertified',
        description: 'This is the AllergyCertified certification',
      },
      {
        filter_id: cleanIngredientsFilter?.id,
        name: 'Vegan Certified',
        slug: 'vegan-certified',
        certifying_body: 'The Vegan Society',
        description: 'This is the Vegan Certified certification',
      },

      // Gives Back Certifications
      {
        filter_id: givesBackFilter?.id,
        name: 'B Corp',
        slug: 'b-corp',
        certifying_body: 'B Lab',
        description: 'This is the B Corp certification',
      },
      {
        filter_id: givesBackFilter?.id,
        name: '1% for the Planet',
        slug: '1-percent-for-the-planet',
        certifying_body: '1% for the Planet',
        description: 'This is the 1% for the Planet certification',
      },
      {
        filter_id: givesBackFilter?.id,
        name: 'Certified B Corporation',
        slug: 'certified-b-corporation',
        certifying_body: 'B Lab',
        description: 'This is the Certified B Corporation certification',
      },
      {
        filter_id: givesBackFilter?.id,
        name: 'Social Enterprise Mark',
        slug: 'social-enterprise-mark',
        certifying_body: 'Social Enterprise Mark CIC',
        description: 'This is the Social Enterprise Mark certification',
      },

      // Minority-Owned Certifications
      {
        filter_id: minorityOwnedFilter?.id,
        name: 'MBE Certification',
        slug: 'mbe-certification',
        certifying_body: 'NMSDC',
        description: 'This is the MBE Certification certification',
      },
      {
        filter_id: minorityOwnedFilter?.id,
        name: 'CAMSC Certification',
        slug: 'camsc-certification',
        certifying_body: 'CAMSC',
        description: 'This is the CAMSC Certification certification',
      },
      {
        filter_id: minorityOwnedFilter?.id,
        name: 'USPAACC Certification',
        slug: 'uspaacc-certification',
        certifying_body: 'USPAACC',
        description: 'This is the USPAACC Certification certification',
      },

      // Woman-Owned Certifications
      {
        filter_id: womanOwnedFilter?.id,
        name: 'WBENC Certification',
        slug: 'wbenc-certification',
        certifying_body: 'WBENC',
        description: 'This is the WBENC Certification certification',
      },
      {
        filter_id: womanOwnedFilter?.id,
        name: 'WEConnect International',
        slug: 'weconnect-international',
        certifying_body: 'WEConnect International',
        description: 'This is the WEConnect International certification',
      },
      {
        filter_id: womanOwnedFilter?.id,
        name: 'WOSB Certification',
        slug: 'wosb-certification',
        certifying_body: 'US SBA',
        description: 'This is the WOSB Certification certification',
      },

      // Employee-Owned Certifications
      {
        filter_id: employeeOwnedFilter?.id,
        name: 'Certified Employee Owned',
        slug: 'certified-employee-owned',
        certifying_body: 'Certified EO',
        description: 'This is the Certified Employee Owned certification',
      },

      // Small Business Certifications
      {
        filter_id: smallBusinessFilter?.id,
        name: 'SBA Small Business Certification',
        slug: 'sba-small-business-certification',
        certifying_body: 'US SBA',
        description:
          'This is the SBA Small Business Certification certification',
      },
    ];

    for (const certData of certifications) {
      const existing = await this.certificationRepository.findOne({
        where: { slug: certData.slug },
      });
      if (!existing) {
        const certification = this.certificationRepository.create(certData);
        await this.certificationRepository.save(certification);
      }
    }
  }

  async drop(): Promise<any> {
    const certifications = await this.certificationRepository.find();
    for (const cert of certifications) {
      await this.certificationRepository.remove(cert);
    }
  }
}
