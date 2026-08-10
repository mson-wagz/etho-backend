import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeSiteToReviewSoftDeletable1773828804299 implements MigrationInterface {
  name = 'MakeSiteToReviewSoftDeletable1773828804299';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sites_to_review" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sites_to_review" DROP COLUMN "deleted_at"`,
    );
  }
}
