import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSourceUrlAndShortDescriptionToProductVariant1768405216258 implements MigrationInterface {
  name = 'AddSourceUrlAndShortDescriptionToProductVariant1768405216258';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "availability"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ADD "source_url" character varying(500) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "short_description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_certifications" DROP COLUMN "detected_from"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_certifications" ADD "detected_from" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_filters" DROP COLUMN "source"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_filters" ADD "source" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "source_url" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "source_url" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_filters" DROP COLUMN "source"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_filters" ADD "source" character varying(50) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_certifications" DROP COLUMN "detected_from"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_certifications" ADD "detected_from" character varying(50) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "short_description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" DROP COLUMN "source_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "availability" character varying(100)`,
    );
  }
}
