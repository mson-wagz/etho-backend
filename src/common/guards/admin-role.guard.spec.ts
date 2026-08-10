/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminRoleGuard } from './admin-role.guard';
import { Test, TestingModule } from '@nestjs/testing';

describe('AdminRoleGuard', () => {
  let guard: AdminRoleGuard;
  let mockExecutionContext: Partial<ExecutionContext>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminRoleGuard],
    }).compile();

    guard = module.get<AdminRoleGuard>(AdminRoleGuard);
  });

  const createMockContext = (user: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as any;

  describe('canActivate', () => {
    it('should allow access when user has admin role', () => {
      const mockUser = {
        userId: '1',
        email: 'admin@test.com',
        role: 'admin',
      };

      mockExecutionContext = createMockContext(mockUser);

      const result = guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user does not have admin role', () => {
      const mockUser = {
        userId: '2',
        email: 'user@test.com',
        role: 'user',
      };

      mockExecutionContext = createMockContext(mockUser);

      expect(() => {
        guard.canActivate(mockExecutionContext as ExecutionContext);
      }).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user role is null', () => {
      const mockUser = {
        userId: '3',
        email: 'test@test.com',
        role: null,
      };

      mockExecutionContext = createMockContext(mockUser);

      expect(() => {
        guard.canActivate(mockExecutionContext as ExecutionContext);
      }).toThrow(ForbiddenException);
    });

    it('should throw correct error message for non-admin user', () => {
      const mockUser = {
        userId: '5',
        email: 'user@test.com',
        role: 'user',
      };

      mockExecutionContext = createMockContext(mockUser);

      expect(() => {
        guard.canActivate(mockExecutionContext as ExecutionContext);
      }).toThrow('Admin role required');
    });

    it('should handle case-sensitive role checking', () => {
      const mockUser = {
        userId: '6',
        email: 'admin@test.com',
        role: 'Admin',
      };

      mockExecutionContext = createMockContext(mockUser);

      expect(() => {
        guard.canActivate(mockExecutionContext as ExecutionContext);
      }).toThrow(ForbiddenException);
    });
  });
});
