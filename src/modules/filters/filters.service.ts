/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { FiltersResponse } from './dto/filters-response.dto';
import { FilterRepository } from '../../repository/filter.repository';
import { AdminFilterSettingsResponseDto } from '../admin/dto/admin-filter-settings.dto';
import { CreateFilterDto } from '../admin/dto/create-filter.dto';
import { UpdateFilterDto } from '../admin/dto/update-filter.dto';
import { Filter, FilterTier } from '../../entities/filter.entity';
import { FilterKeywordRepository } from '../../repository/filter-keyword.repository';

@Injectable()
export class FilterService {
  constructor(
    private readonly filtersRepository: FilterRepository,
    private readonly filterKeywordRepository: FilterKeywordRepository,
  ) {}

  async getFilters(): Promise<FiltersResponse[]> {
    try {
      const filters = await this.filtersRepository.find({
        relations: ['keywords'],
      });

      const filtersResponses: FiltersResponse[] = filters.map((filter) => ({
        id: filter.id,
        name: filter.name,
        slug: filter.slug,
        tier: filter.tier,
        description: filter.description,
        keywords: filter.keywords?.map((k) => k.keyword) || [],
        priority: filter.priority,
        createdAt: filter.created_at,
        updatedAt: filter.updated_at,
      }));

      return filtersResponses;
    } catch (error) {
      console.error('Service error:', error);
      throw new Error(`Failed to fetch filters: ${error.message}`);
    }
  }

  async getFilterBySlug(slug: string): Promise<FiltersResponse | null> {
    try {
      const filter = await this.filtersRepository.findBySlug(slug);
      if (!filter) return null;

      return {
        id: filter.id,
        name: filter.name,
        slug: filter.slug,
        tier: filter.tier,
        description: filter.description,
        keywords: filter.keywords?.map((k) => k.keyword) || [],
        priority: filter.priority,
        createdAt: filter.created_at,
        updatedAt: filter.updated_at,
      };
    } catch (error) {
      throw new Error(`Failed to fetch filter: ${error.message}`);
    }
  }

  async getAdminFilterSettings(
    categoryName?: string,
    searchQuery?: string,
  ): Promise<AdminFilterSettingsResponseDto> {
    try {
      const queryBuilder = this.filtersRepository
        .createQueryBuilder('filter')
        .leftJoinAndSelect('filter.certifications', 'certification')
        .leftJoinAndSelect('filter.keywords', 'keyword')
        .orderBy('filter.priority', 'ASC')
        .addOrderBy('filter.name', 'ASC');

      // Apply category name filter if provided
      if (categoryName) {
        queryBuilder.andWhere('filter.name ILIKE :categoryName', {
          categoryName: `%${categoryName}%`,
        });
      }

      // Apply search query filter if provided
      if (searchQuery) {
        queryBuilder.andWhere('filter.name ILIKE :searchQuery', {
          searchQuery: `%${searchQuery}%`,
        });
      }

      const filters = await queryBuilder.getMany();

      // Calculate counts
      const totalFilters = filters.length;
      const totalCertifications = filters.reduce(
        (sum, filter) => sum + (filter.certifications?.length || 0),
        0,
      );
      const totalKeywords = filters.reduce(
        (sum, filter) => sum + (filter.keywords?.length || 0),
        0,
      );

      return {
        filters: filters.map((filter) => ({
          id: filter.id,
          name: filter.name,
          slug: filter.slug,
          tier: filter.tier,
          description: filter.description,
          priority: filter.priority,
          certifications:
            filter.certifications?.map((cert) => ({
              id: cert.id,
              name: cert.name,
              slug: cert.slug,
              certifying_body: cert.certifying_body,
              description: cert.description,
            })) || [],
          keywords:
            filter.keywords?.map((keyword) => ({
              id: keyword.id,
              keyword: keyword.keyword,
            })) || [],
          created_at: filter.created_at,
          updated_at: filter.updated_at,
        })),
        counts: {
          total_filters: totalFilters,
          total_certifications: totalCertifications,
          total_keywords: totalKeywords,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch admin filter settings: ${error.message}`,
      );
    }
  }

  async createFilter(createFilterDto: CreateFilterDto): Promise<Filter> {
    const { name, tier, description } = createFilterDto;

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Reject names that generate empty slugs
    if (!slug) {
      throw new BadRequestException(
        'Filter name must contain at least one alphanumeric character',
      );
    }

    // Check if filter with same name or slug exists
    const existingFilter = await this.filtersRepository.findOne({
      where: [{ name }, { slug }],
    });

    if (existingFilter) {
      throw new ConflictException(
        existingFilter.name === name
          ? 'Filter with this name already exists'
          : 'Filter name generates a conflicting slug',
      );
    }

    // Set priority based on tier
    const priority = tier === FilterTier.PRIMARY ? 6 : 3;

    const filter = this.filtersRepository.create({
      name,
      slug,
      tier,
      description,
      priority,
    });

    try {
      return await this.filtersRepository.save(filter);
    } catch (error) {
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        const isTierSlugConstraint =
          error.constraint?.includes('tier') ||
          error.constraint?.includes('slug') ||
          error.message?.toLowerCase().includes('tier') ||
          error.message?.toLowerCase().includes('slug');

        if (isTierSlugConstraint) {
          throw new ConflictException(
            'Filter with this tier and slug already exists',
          );
        } else {
          throw new ConflictException(
            'Filter name generates a conflicting slug',
          );
        }
      }
      throw error;
    }
  }

  async updateFilter(
    id: string,
    updateFilterDto: UpdateFilterDto,
  ): Promise<Filter> {
    const filter = await this.filtersRepository.findOne({ where: { id } });

    if (!filter) {
      throw new NotFoundException('Filter not found');
    }

    const { name, tier, description } = updateFilterDto;

    // Update slug if name is being updated
    if (name && name !== filter.name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Reject names that generate empty slugs
      if (!slug) {
        throw new BadRequestException(
          'Filter name must contain at least one alphanumeric character',
        );
      }

      // Check if another filter with same name or slug exists
      const existingFilter = await this.filtersRepository.findOne({
        where: [{ name }, { slug }],
      });

      if (existingFilter && existingFilter.id !== id) {
        throw new ConflictException(
          existingFilter.name === name
            ? 'Filter with this name already exists'
            : 'Filter name generates a conflicting slug',
        );
      }

      filter.name = name;
      filter.slug = slug;
    }

    if (tier !== undefined) {
      filter.tier = tier;
      // Update priority based on new tier
      filter.priority = tier === FilterTier.PRIMARY ? 6 : 3;
    }

    if (description !== undefined) {
      filter.description = description;
    }

    return await this.filtersRepository.save(filter);
  }

  async deleteFilter(id: string): Promise<void> {
    const filter = await this.filtersRepository.findOne({ where: { id } });

    if (!filter) {
      throw new NotFoundException('Filter not found');
    }

    // Keywords will be cascade deleted due to entity relationship
    await this.filtersRepository.remove(filter);
  }
}
