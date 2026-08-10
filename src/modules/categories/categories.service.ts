/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { CategoryRepository } from '../../repository/category.repository';
import { CategoryResponseDto } from './dto/category-response.dto';
import { Category } from 'src/entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async getAllCategories(
    select: 'all' | 'available' = 'available',
  ): Promise<CategoryResponseDto[]> {
    try {
      const categories =
        select === 'available'
          ? await this.categoryRepository.getAvailableCategories()
          : await this.categoryRepository.getAllCategories();

      const formatChildren = (
        categories: Category[],
      ): CategoryResponseDto[] => {
        if (categories.length === 0) return [];
        return categories.map((child) => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
          path: child.path,
          parentId: child.parent_id,
          children: formatChildren(child.children || []),
        }));
      };

      return categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        path: category.path,
        parentId: category.parent_id,
        children: formatChildren(category.children || []),
      }));
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }

  async getTopLevelCategories(
    select: 'all' | 'available' = 'available',
  ): Promise<CategoryResponseDto[]> {
    try {
      const categories =
        await this.categoryRepository.getRootCategoriesWithAvailability(
          select === 'available',
        );

      return categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        path: category.path,
        parentId: category.parent_id,
        children:
          category.children?.map((child) => ({
            id: child.id,
            name: child.name,
            slug: child.slug,
            path: child.path,
            parentId: child.parent_id,
          })) || [],
      }));
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }

  async getCategoryBySlug(slug: string): Promise<CategoryResponseDto | null> {
    try {
      const category = await this.categoryRepository.findBySlug(slug);
      if (!category) return null;

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        path: category.path,
        parentId: category.parent_id,
      };
    } catch (error) {
      throw new Error(`Failed to fetch category: ${error.message}`);
    }
  }

  async getSubcategories(parentId: string): Promise<CategoryResponseDto[]> {
    try {
      const categories = await this.categoryRepository.findByParentId(parentId);
      return categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        path: category.path,
        parentId: category.parent_id,
        children:
          category.children?.map((child) => ({
            id: child.id,
            name: child.name,
            slug: child.slug,
            path: child.path,
            parentId: child.parent_id,
          })) || [],
      }));
    } catch (error) {
      throw new Error(`Failed to fetch subcategories: ${error.message}`);
    }
  }
}
