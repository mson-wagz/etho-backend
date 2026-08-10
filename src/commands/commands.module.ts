import { Module } from '@nestjs/common';
import { CreateAdminCommand } from './create-admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import dataSource from '../common/config/db.config';
import { RepositoryModule } from 'src/repository/repository.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
    TypeOrmModule.forRootAsync({
      useFactory: () => dataSource.options,
    }),
    RepositoryModule,
    AuthModule,
  ],
  controllers: [],
  providers: [CreateAdminCommand],
})
export class CommandsModule {}
