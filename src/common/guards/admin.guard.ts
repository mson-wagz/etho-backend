import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './auth.guard';
import { AdminRoleGuard } from './admin-role.guard';
import { lastValueFrom, isObservable } from 'rxjs';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly adminRoleGuard: AdminRoleGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const jwtResult = this.jwtAuthGuard.canActivate(context);

    const jwtAllowed = isObservable(jwtResult)
      ? await lastValueFrom(jwtResult)
      : await Promise.resolve(jwtResult);

    if (!jwtAllowed) return false;

    const roleResult = this.adminRoleGuard.canActivate(context);

    return isObservable(roleResult)
      ? await lastValueFrom(roleResult)
      : await Promise.resolve(roleResult);
  }
}
