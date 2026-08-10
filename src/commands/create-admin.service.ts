import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { AdminLoginService } from 'src/modules/auth/admin-login/admin-login.service';

interface CreateAdminOptions {
  email?: string;
  password?: string;
  name?: string;
  force?: boolean;
}

@Injectable()
@Command({
  name: 'create-admin',
  description: 'Create the first super admin account',
  subCommands: [],
  options: {
    isDefault: false,
  },
  aliases: ['ca'],
})
export class CreateAdminCommand extends CommandRunner {
  constructor(private readonly adminloginService: AdminLoginService) {
    super();
  }

  async run(
    passedParams: string[],
    options?: CreateAdminOptions,
  ): Promise<void> {
    try {
      const email = options?.email || 'admin@etho.com';
      const password = options?.password || this.generateRandomPassword();
      const name = options?.name || 'Super Admin';

      console.log('🚀 Creating super admin account...');
      console.log(`📧 Email: ${email}`);
      console.log(`👤 Name: ${name}`);

      let existingUser: { id: string; email: string } | null;
      try {
        existingUser = await this.adminloginService.findAdminByEmail(email);
      } catch {
        //probably 404 from the db
        existingUser = null;
      }

      if (existingUser) {
        console.log('❌ Admin with this email already exists!');
        console.log('💡 Use --force flag to update existing admin');

        if (!options?.force) {
          return;
        }

        await this.adminloginService.updateAdminPassword(
          existingUser.id,
          password,
        );

        console.log('✅ Existing user updated to Super Admin!');
      } else {
        const admin = await this.adminloginService.createAdminUser(
          email,
          password,
        );

        console.log('✅ Admin created successfully!');
        console.log(`🆔 User ID: ${admin.id}`);
      }

      console.log('');
      console.log('📋 Login Details:');
      console.log(`📧 Email: ${email}`);
      console.log(`🔐 Password: ${password}`);
      console.log('');
      console.log(
        '⚠️  IMPORTANT: Please change the password after first login!',
      );
    } catch (error) {
      console.error(
        '❌ Error creating super admin:',
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  @Option({
    flags: '-h, --help',
    description: 'Display help information',
  })
  showHelp(): void {
    console.log(`Usage: create-admin [options]
  Options:
    -h, --help               Display help information
    -e, --email <string>     Admin email address (default: admin@etho.com)
    -p, --password <string>  Admin password (will be generated if not provided)
    -n, --name <string>      Admin full name (default: Super Admin)
    -f, --force              Force update existing user to super admin (if exists)`);
    process.exit(0);
  }

  @Option({
    flags: '-e, --email <string>',
    description: 'Admin email address',
  })
  parseEmail(val: string): string {
    return val;
  }

  @Option({
    flags: '-p, --password <string>',
    description: 'Admin password (will be generated if not provided)',
  })
  parsePassword(val: string): string {
    return val;
  }

  @Option({
    flags: '-n, --name <string>',
    description: 'Admin full name',
  })
  parseName(val: string): string {
    return val;
  }

  @Option({
    flags: '-u, --username <string>',
    description: 'Force update existing user to super admin',
  })
  parseForce(): boolean {
    return true;
  }

  private generateRandomPassword(): string {
    const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    password += 'A';
    password += 'a';
    password += '1';
    password += '!';

    for (let i = 4; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
