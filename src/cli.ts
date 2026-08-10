import { CommandFactory } from 'nest-commander';
import { CommandsModule } from './commands/commands.module';

async function bootstrap() {
  await CommandFactory.run(CommandsModule, {
    logger: ['error', 'warn'],
  });
}

bootstrap().catch((err) => {
  console.error('CLI Error:', err);
  process.exit(1);
});
