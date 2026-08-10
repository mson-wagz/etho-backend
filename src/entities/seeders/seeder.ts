import { seeder } from 'nestjs-seeder';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandSeeder } from './brand.seeder';
import { CategorySeeder } from './category.seeder';
import { FilterSeeder } from './filter.seeder';
import { CertificationSeeder } from './certification.seeder';
import { GeneralSettingsSeeder } from './generalSettings.seeder';
import dataSource from '../../common/config/db.config';
import { RepositoryModule } from 'src/repository/repository.module';
import 'dotenv/config';

seeder({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => dataSource.options,
    }),
    RepositoryModule,
  ],
}).run([
  BrandSeeder,
  CategorySeeder,
  FilterSeeder,
  CertificationSeeder,
  GeneralSettingsSeeder,
]);
