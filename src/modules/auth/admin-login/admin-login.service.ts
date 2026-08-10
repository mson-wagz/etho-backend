/* eslint-disable @typescript-eslint/no-unused-vars */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../../repository/user.repository';
import * as bcrypt from 'bcrypt';
import { LoginDto, LoginResponseDto } from './dto/admin-login.dto';
import { User, UserRole } from '../../../entities/user.entity';

@Injectable()
export class AdminLoginService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async validateAdminUser(
    email: string,
    password: string,
  ): Promise<{ id: string; email: string; role: string }> {
    try {
      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (user.role !== UserRole.ADMIN) {
        throw new UnauthorizedException('Access denied');
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const { password_hash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    const user: { id: string; email: string; role: string } =
      await this.validateAdminUser(email, password);

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: '48h',
    });

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async createAdminUser(email: string, password: string): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Admin user with this email already exists');
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newAdminUser = this.userRepository.create({
      email,
      password_hash,
      role: UserRole.ADMIN,
    });

    return await this.userRepository.save(newAdminUser);
  }

  async updateAdminPassword(email: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || user.role !== UserRole.ADMIN) {
      throw new Error('Admin user not found');
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userRepository.update(user.id, {
      password_hash: newHashedPassword,
    });
  }

  async findAdminByEmail(
    email: string,
  ): Promise<{ id: string; email: string } | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || user.role !== UserRole.ADMIN) {
      return null;
    }
    return { id: user.id, email: user.email };
  }
}
