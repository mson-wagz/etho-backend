import { Module } from '@nestjs/common';
import { FiltersController } from './filters.controller';
import { FilterService } from './filters.service';

@Module({
  imports: [],
  controllers: [FiltersController],
  providers: [FilterService],
  exports: [FilterService],
})
export class FiltersModule {}
