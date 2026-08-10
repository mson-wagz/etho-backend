import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaxQueriesToGeneralSettings1773764027216 implements MigrationInterface {
  name = 'AddMaxQueriesToGeneralSettings1773764027216';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "general_settings" ADD "discovery_max_queries" integer DEFAULT '10'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "general_settings" DROP COLUMN "discovery_max_queries"`,
    );
  }
}
