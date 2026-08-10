import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AdminLoginService } from './admin-login.service';
import { LoginDto } from './dto/admin-login.dto';
import { UserRepository } from '../../../repository/user.repository';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../../entities/user.entity';

jest.mock('bcrypt');

describe('AdminLoginService', () => {
  let service: AdminLoginService;
  let userRepository: jest.Mocked<UserRepository>;
  let jwtService: jest.Mocked<JwtService>;

  const mockAdminUser = {
    id: '1',
    email: 'admin@test.com',
    password_hash: 'hashedPassword',
    name: 'Admin User',
    role: UserRole.ADMIN,
    email_verified: true,
    last_login_at: new Date(),
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockNonAdminUser = {
    id: '2',
    email: 'user@test.com',
    password_hash: 'hashedPassword',
    name: 'Regular User',
    role: UserRole.SHOPPER,
    email_verified: true,
    last_login_at: new Date(),
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminLoginService,
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminLoginService>(AdminLoginService);
    userRepository = module.get(UserRepository);
    jwtService = module.get(JwtService);
  });

  describe('validateAdminUser', () => {
    it('should validate admin user successfully', async () => {
      userRepository.findByEmail.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateAdminUser(
        'admin@test.com',
        'password',
      );

      expect(result).toEqual({
        id: '1',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        name: mockAdminUser.name,
        email_verified: mockAdminUser.email_verified,
        last_login_at: mockAdminUser.last_login_at,
        is_active: mockAdminUser.is_active,
        created_at: mockAdminUser.created_at,
        updated_at: mockAdminUser.updated_at,
      });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateAdminUser('nonexistent@test.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-admin user', async () => {
      userRepository.findByEmail.mockResolvedValue(mockNonAdminUser);

      await expect(
        service.validateAdminUser('user@test.com', 'password'),
      ).rejects.toThrow('Access denied');
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      userRepository.findByEmail.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateAdminUser('admin@test.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should login admin user successfully', async () => {
      const loginDto: LoginDto = {
        email: 'admin@test.com',
        password: 'password',
      };

      userRepository.findByEmail.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin',
        },
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: '1',
          email: 'admin@test.com',
          role: 'admin',
        }),
        { expiresIn: '48h' },
      );
    });
  });
});
