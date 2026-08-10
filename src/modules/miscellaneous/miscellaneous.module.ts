import { Module } from '@nestjs/common';
import { MiscellaneousController } from './miscellaneous.controller';
import { MiscellaneousService } from './miscellaneous.service';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';
import { AdminRoleGuard } from 'src/common/guards/admin-role.guard';

@Module({
  controllers: [MiscellaneousController],
  providers: [MiscellaneousService, JwtAuthGuard, AdminRoleGuard],
  exports: [MiscellaneousService],
})
export class MiscellaneousModule {}
