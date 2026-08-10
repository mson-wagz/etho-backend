import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeSessionIdTypeToText1768488452293 implements MigrationInterface {
  name = 'ChangeSessionIdTypeToText1768488452293';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "analytics_events" DROP COLUMN "session_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "analytics_events" ADD "session_id" text NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "analytics_events" DROP COLUMN "session_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "analytics_events" ADD "session_id" uuid NOT NULL`,
    );
  }
}
