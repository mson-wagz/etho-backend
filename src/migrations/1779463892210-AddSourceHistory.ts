import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSourceHistory1779463892210 implements MigrationInterface {
  name = 'AddSourceHistory1779463892210';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "source_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "website_url" character varying, "origin" character varying NOT NULL DEFAULT 'manual', "added_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_86f85c5f1758765c1852807cb83" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "source_history"`);
  }
}
