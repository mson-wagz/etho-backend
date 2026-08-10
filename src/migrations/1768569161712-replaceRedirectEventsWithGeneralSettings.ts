import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceRedirectEventsWithGeneralSettings1768569161712 implements MigrationInterface {
  name = 'ReplaceRedirectEventsWithGeneralSettings1768569161712';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "redirect_events"`);
    await queryRunner.query(
      `CREATE TYPE "public"."general_settings_scraping_frequency_period_unit_enum" AS ENUM('days', 'weeks', 'months', 'years')`,
    );
    await queryRunner.query(
      `CREATE TABLE "general_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "scraping_frequency" integer NOT NULL DEFAULT '1', "scraping_frequency_period_value" integer NOT NULL DEFAULT '3', "scraping_frequency_period_unit" "public"."general_settings_scraping_frequency_period_unit_enum" NOT NULL DEFAULT 'days', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c3b79ecb7c2446f3ba18a07f8e4" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "general_settings"`);
    await queryRunner.query(
      `DROP TYPE "public"."general_settings_scraping_frequency_period_unit_enum"`,
    );
    await queryRunner.query(
      `CREATE TABLE "redirect_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid, "product_id" uuid NOT NULL, "source_page" character varying(100), "destination_url" text NOT NULL, "clicked_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ef334501910ad7ebbd231eef382" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_redirect_events_product" ON "redirect_events" ("product_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "redirect_events" ADD CONSTRAINT "FK_e8c7e532dc6a768bc838db84ecf" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
