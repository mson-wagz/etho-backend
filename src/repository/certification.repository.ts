import { Injectable } from '@nestjs/common';
import { DataSource, Repository, ILike } from 'typeorm';
import { Certification } from '../entities/certification.entity';

@Injectable()
export class CertificationRepository extends Repository<Certification> {
  constructor(private dataSource: DataSource) {
    super(Certification, dataSource.createEntityManager());
  }

  async findBySlug(slug: string): Promise<Certification | null> {
    return this.findOne({ where: { slug } });
  }

  async findAll(): Promise<Certification[]> {
    return this.find();
  }

  async findWithSearch(searchQuery?: string): Promise<Certification[]> {
    const queryBuilder = this.createQueryBuilder('certification')
      .leftJoinAndSelect('certification.filter', 'filter')
      .orderBy('certification.name', 'ASC');

    if (searchQuery) {
      queryBuilder.where('certification.name ILIKE :search', {
        search: `%${searchQuery}%`,
      });
    }

    return queryBuilder.getMany();
  }

  async findByName(name: string): Promise<Certification | null> {
    return this.findOne({ where: { name } });
  }

  async findByNameExcludingId(
    name: string,
    excludeId: string,
  ): Promise<Certification | null> {
    return this.createQueryBuilder('certification')
      .where('certification.name = :name', { name })
      .andWhere('certification.id != :excludeId', { excludeId })
      .getOne();
  }
}
