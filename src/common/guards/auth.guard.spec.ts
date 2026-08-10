/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './auth.guard';
import { Test, TestingModule } from '@nestjs/testing';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockExecutionContext: Partial<ExecutionContext>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);

    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: jest.fn().mockReturnValue({
          headers: {},
          cookies: {},
        }),
      }),
    } as any;
  });

  describe('handleRequest', () => {
    it('should return user when authentication is successful', () => {
      const mockUser = {
        userId: '1',
        email: 'admin@test.com',
        role: 'admin',
      };

      const result = guard.handleRequest(null, mockUser);

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user is null', () => {
      expect(() => {
        guard.handleRequest(null, null);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is undefined', () => {
      expect(() => {
        guard.handleRequest(null, undefined);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when there is an error', () => {
      const error = new Error('JWT malformed');
      const mockUser = { userId: '1', email: 'test@test.com', role: 'admin' };

      expect(() => {
        guard.handleRequest(error, mockUser);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with correct message', () => {
      expect(() => {
        guard.handleRequest(null, null);
      }).toThrow('Missing or invalid authentication token');
    });
  });

  describe('canActivate', () => {
    it('should call super.canActivate', () => {
      // Spy on the parent class method
      const superCanActivateSpy = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      );
      superCanActivateSpy.mockReturnValue(true);

      const result = guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(superCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);
      expect(result).toBe(true);

      superCanActivateSpy.mockRestore();
    });
  });
});
