/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ExecutionContext } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { JwtAuthGuard } from './auth.guard';
import { AdminRoleGuard } from './admin-role.guard';
import { Test, TestingModule } from '@nestjs/testing';
import 'jest-extended';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let jwtAuthGuard: jest.Mocked<JwtAuthGuard>;
  let adminRoleGuard: jest.Mocked<AdminRoleGuard>;
  let mockExecutionContext: Partial<ExecutionContext>;

  beforeEach(async () => {
    const mockJwtAuthGuard = {
      canActivate: jest.fn(),
    };

    const mockAdminRoleGuard = {
      canActivate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminGuard,
        {
          provide: JwtAuthGuard,
          useValue: mockJwtAuthGuard,
        },
        {
          provide: AdminRoleGuard,
          useValue: mockAdminRoleGuard,
        },
      ],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
    jwtAuthGuard = module.get(JwtAuthGuard);
    adminRoleGuard = module.get(AdminRoleGuard);

    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: jest.fn().mockReturnValue({
          user: {
            userId: '1',
            email: 'admin@test.com',
            role: 'admin',
          },
        }),
      }),
    } as any;
  });

  describe('canActivate', () => {
    it('should allow access when both JWT and admin role checks pass', async () => {
      jwtAuthGuard.canActivate.mockResolvedValue(true);
      adminRoleGuard.canActivate.mockReturnValue(true);

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(jwtAuthGuard.canActivate).toHaveBeenCalledWith(
        mockExecutionContext,
      );
      expect(adminRoleGuard.canActivate).toHaveBeenCalledWith(
        mockExecutionContext,
      );
    });

    it('should fail when JWT authentication fails', async () => {
      jwtAuthGuard.canActivate.mockRejectedValue(new Error('Invalid token'));
      adminRoleGuard.canActivate.mockReturnValue(true);

      await expect(
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).rejects.toThrow('Invalid token');

      expect(jwtAuthGuard.canActivate).toHaveBeenCalledWith(
        mockExecutionContext,
      );
      expect(adminRoleGuard.canActivate).not.toHaveBeenCalled();
    });

    it('should fail when admin role check fails', async () => {
      jwtAuthGuard.canActivate.mockResolvedValue(true);
      adminRoleGuard.canActivate.mockReturnValue(false);

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(false);
      expect(jwtAuthGuard.canActivate).toHaveBeenCalledWith(
        mockExecutionContext,
      );
      expect(adminRoleGuard.canActivate).toHaveBeenCalledWith(
        mockExecutionContext,
      );
    });

    it('should fail when both checks fail', async () => {
      jwtAuthGuard.canActivate.mockRejectedValue(new Error('Invalid token'));
      adminRoleGuard.canActivate.mockReturnValue(false);

      await expect(
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).rejects.toThrow('Invalid token');

      expect(jwtAuthGuard.canActivate).toHaveBeenCalledWith(
        mockExecutionContext,
      );
      expect(adminRoleGuard.canActivate).not.toHaveBeenCalled();
    });

    it('should execute guards in correct order', async () => {
      const callOrder: string[] = [];

      jwtAuthGuard.canActivate.mockImplementation(() => {
        callOrder.push('jwt');
        return true;
      });

      adminRoleGuard.canActivate.mockImplementation(() => {
        callOrder.push('admin');
        return true;
      });

      await guard.canActivate(mockExecutionContext as ExecutionContext);

      expect(jwtAuthGuard.canActivate).toHaveBeenCalled();
      expect(adminRoleGuard.canActivate).toHaveBeenCalled();

      expect(callOrder).toEqual(['jwt', 'admin']);
    });

    it('should handle admin role guard throwing exception', async () => {
      jwtAuthGuard.canActivate.mockResolvedValue(true);
      adminRoleGuard.canActivate.mockImplementation(() => {
        throw new Error('Admin role required');
      });

      await expect(
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).rejects.toThrow('Admin role required');

      expect(jwtAuthGuard.canActivate).toHaveBeenCalledWith(
        mockExecutionContext,
      );
      expect(adminRoleGuard.canActivate).toHaveBeenCalledWith(
        mockExecutionContext,
      );
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
