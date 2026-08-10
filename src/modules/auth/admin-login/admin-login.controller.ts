import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  Req,
  Get,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AdminLoginService } from './admin-login.service';
import { LoginDto, LoginResponseDto } from './dto/admin-login.dto';
import { ConfigService } from '@nestjs/config';
import { AdminGuard } from 'src/common/guards/admin.guard';

@ApiTags('Admin Authentication')
@Controller('auth/admin')
export class AdminLoginController {
  constructor(
    private readonly adminLoginService: AdminLoginService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @ApiOperation({
    summary: 'Admin login',
    description:
      'Authenticates admin users and returns JWT token in HTTP-only cookie',
  })
  @ApiBody({
    description: 'Admin login credentials',
    examples: {
      example1: {
        summary: 'Valid admin credentials',
        value: {
          email: 'admin@example.com',
          password: 'adminpassword123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful - JWT token set in HTTP-only cookie',
    schema: {
      example: {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'admin@example.com',
          role: 'admin',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials or non-admin user',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'Email must be a valid email address',
          'Password must be at least 6 characters long',
        ],
        error: 'Bad Request',
      },
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Omit<LoginResponseDto, 'access_token'>> {
    try {
      const loginResponse = await this.adminLoginService.login(loginDto);

      const cookieOptions = {
        httpOnly: true,
        secure: this.configService.get('NODE_ENV') !== 'development',
        sameSite: 'lax' as const,
        maxAge: 48 * 60 * 60 * 1000,
        path: '/',
        signed: true,
      };

      response.cookie('auth-token', loginResponse.access_token, cookieOptions);

      return {
        user: loginResponse.user,
      };
    } catch (error) {
      response.status(HttpStatus.UNAUTHORIZED);
      throw error;
    }
  }

  @UseGuards(AdminGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Get authenticated admin user info',
    description:
      'Returns information about the currently authenticated admin user',
  })
  @ApiResponse({
    status: 200,
    description: 'Authenticated admin user info retrieved successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'example@example.com',
        role: 'admin',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - No valid authentication token provided',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  getMe(@Req() request: Request): {
    id: string;
    email: string;
    role: string;
  } {
    try {
      const user = request.user as {
        userId: string;
        email: string;
        role: string;
      };

      if (user) {
        return {
          id: user.userId,
          email: user.email,
          role: user.role,
        };
      }

      throw new Error('Unauthorized');
    } catch (error) {
      console.error('Error in getMe:', error);
      throw new UnauthorizedException('Unauthorized');
    }
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Admin logout',
    description: 'Clears authentication cookie and logs out admin user',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful - Authentication cookie cleared',
    schema: {
      example: {
        message: 'Logged out successfully',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    },
  })
  logout(@Res({ passthrough: true }) response: Response): { message: string } {
    response.clearCookie('auth-token');

    return { message: 'Logged out successfully' };
  }
}
