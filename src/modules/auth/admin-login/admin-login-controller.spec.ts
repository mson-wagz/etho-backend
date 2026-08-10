/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { AdminLoginController } from './admin-login.controller';
import { AdminLoginService } from './admin-login.service';
import { LoginDto } from './dto/admin-login.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';

describe('AdminLoginController', () => {
  let controller: AdminLoginController;
  let service: jest.Mocked<AdminLoginService>;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminLoginController],
      providers: [
        {
          provide: AdminLoginService,
          useValue: {
            login: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminLoginController>(AdminLoginController);
    service = module.get(AdminLoginService);

    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('login', () => {
    it('should login admin and set cookie', async () => {
      const loginDto: LoginDto = {
        email: 'admin@test.com',
        password: 'password',
      };

      const mockLoginResponse = {
        access_token: 'mock-jwt-token',
        user: {
          id: '1',
          email: 'admin@test.com',
          role: 'admin',
        },
      };

      service.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto, mockResponse as Response);

      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'auth-token',
        'mock-jwt-token',
        expect.objectContaining({
          httpOnly: true,
          maxAge: 48 * 60 * 60 * 1000, // 48 hours
          sameSite: 'strict',
        }),
      );
      expect(result).toEqual({
        user: mockLoginResponse.user,
      });
    });

    it('should handle login failure', async () => {
      const loginDto: LoginDto = {
        email: 'admin@test.com',
        password: 'wrongpassword',
      };

      service.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(
        controller.login(loginDto, mockResponse as Response),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should clear auth cookie', () => {
      const result = controller.logout(mockResponse as Response);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'auth-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
        }),
      );
      expect(result).toEqual({
        message: 'Logged out successfully',
      });
    });
  });
});
