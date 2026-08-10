import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { AdminRoleGuard } from '../../common/guards/admin-role.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminLoginController } from './admin-login/admin-login.controller';
import { AdminLoginService } from './admin-login/admin-login.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn:
            parseInt(configService.get<string>('JWT_EXPIRATION') || '0', 10) ||
            undefined,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminLoginController],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    AdminRoleGuard,
    AdminGuard,
    AdminLoginService,
  ],
  exports: [JwtAuthGuard, AdminRoleGuard, AdminGuard, AdminLoginService],
})
export class AuthModule {}
