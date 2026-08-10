import { Injectable } from '@nestjs/common';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoryRepository extends Repository<Category> {
  constructor(private dataSource: DataSource) {
    super(Category, dataSource.createEntityManager());
  }

  async getAllCategories(): Promise<Category[]> {
    return this.find({
      relations: ['children'],
      order: { level: 'ASC', name: 'ASC' },
    });
  }

  async getAvailableCategories(): Promise<Category[]> {
    const [allCategories, withProducts] = await Promise.all([
      this.find({ order: { level: 'ASC', name: 'ASC' } }),
      this.createQueryBuilder('category')
        .select('category.id')
        .where((qb) => {
          const subQuery = qb
            .subQuery()
            .select('DISTINCT product.category_id')
            .from('products', 'product')
            .getQuery();
          return `category.id IN ${subQuery}`;
        })
        .getMany(),
    ]);

    const productIds = new Set(withProducts.map((c) => c.id));
    const nodeMap = new Map<string, Category>(
      allCategories.map((c) => [c.id, { ...c, children: [] }]),
    );

    const roots: Category[] = [];
    for (const node of nodeMap.values()) {
      if (node.parent_id) {
        nodeMap.get(node.parent_id)?.children.push(node);
      } else {
        roots.push(node);
      }
    }

    const hasAvailable = (node: Category): boolean =>
      productIds.has(node.id) || node.children.some(hasAvailable);

    const prune = (nodes: Category[]): Category[] =>
      nodes
        .filter(hasAvailable)
        .map((n) => ({ ...n, children: prune(n.children) }));

    return prune(roots);
  }

  async getRootCategoriesWithAvailability(
    onlyAvailable: boolean = false,
  ): Promise<Category[]> {
    const query = this.createQueryBuilder('category')
      .leftJoinAndSelect('category.children', 'children')
      .where('category.parent_id IS NULL');

    if (onlyAvailable) {
      query.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('DISTINCT product.category_id')
          .from('products', 'product')
          .getQuery();
        return `category.id IN ${subQuery}`;
      });
    }

    return query.orderBy('category.name', 'ASC').getMany();
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.findOne({ where: { slug } });
  }

  async findByParentId(parentId: string): Promise<Category[]> {
    return this.find({
      where: { parent_id: parentId === 'root' ? IsNull() : parentId },
    });
  }

  async findRootCategories(): Promise<Category[]> {
    return this.find({ where: { parent_id: IsNull() } });
  }

  async findDescendantIdsBySlug(slug: string): Promise<string[]> {
    const categories = await this.createQueryBuilder('category')
      .select('category.id')
      .where(':slug = ANY(category.path)', { slug })
      .getMany();
    return categories.map((c) => c.id);
  }
}
