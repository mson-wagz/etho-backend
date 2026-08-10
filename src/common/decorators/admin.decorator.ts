import { applyDecorators, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';

export function RequireAdmin() {
  return applyDecorators(UseGuards(AdminGuard));
}
