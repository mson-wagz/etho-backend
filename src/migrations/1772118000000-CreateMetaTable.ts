import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMetaTable1772118000000 implements MigrationInterface {
  name = 'CreateMetaTable1772118000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "meta" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying(100) NOT NULL, "value" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c4c17a6c2bd7651338b93989168" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "unique_meta_key" ON "meta" ("key") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."unique_meta_key"`);
    await queryRunner.query(`DROP TABLE "meta"`);
  }
}
