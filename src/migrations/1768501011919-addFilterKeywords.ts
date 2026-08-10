import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFilterKeywords1768501011919 implements MigrationInterface {
  name = 'AddFilterKeywords1768501011919';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "filter_keywords" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filter_id" uuid NOT NULL, "keyword" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0fe15fa6c761257207fb72acf8e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_filter_keywords_keyword" ON "filter_keywords" ("keyword") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_filter_keywords_filter_id" ON "filter_keywords" ("filter_id") `,
    );
    await queryRunner.query(`ALTER TABLE "filters" DROP COLUMN "keywords"`);
    await queryRunner.query(
      `ALTER TABLE "filter_keywords" ADD CONSTRAINT "FK_9369bd038aab89f2cd1e251c73a" FOREIGN KEY ("filter_id") REFERENCES "filters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "filter_keywords" DROP CONSTRAINT "FK_9369bd038aab89f2cd1e251c73a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "filters" ADD "keywords" text NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_filter_keywords_filter_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_filter_keywords_keyword"`,
    );
    await queryRunner.query(`DROP TABLE "filter_keywords"`);
  }
}
