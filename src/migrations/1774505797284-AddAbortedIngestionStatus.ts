import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAbortedIngestionStatus1774505797284 implements MigrationInterface {
    name = 'AddAbortedIngestionStatus1774505797284'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."ingestion_runs_status_enum" RENAME TO "ingestion_runs_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."ingestion_runs_status_enum" AS ENUM('standby', 'in_progress', 'completed', 'failed', 'aborted')`);
        await queryRunner.query(`ALTER TABLE "ingestion_runs" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ingestion_runs" ALTER COLUMN "status" TYPE "public"."ingestion_runs_status_enum" USING "status"::"text"::"public"."ingestion_runs_status_enum"`);
        await queryRunner.query(`ALTER TABLE "ingestion_runs" ALTER COLUMN "status" SET DEFAULT 'standby'`);
        await queryRunner.query(`DROP TYPE "public"."ingestion_runs_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ingestion_runs_status_enum_old" AS ENUM('standby', 'in_progress', 'completed', 'failed')`);
        await queryRunner.query(`ALTER TABLE "ingestion_runs" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ingestion_runs" ALTER COLUMN "status" TYPE "public"."ingestion_runs_status_enum_old" USING "status"::"text"::"public"."ingestion_runs_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "ingestion_runs" ALTER COLUMN "status" SET DEFAULT 'standby'`);
        await queryRunner.query(`DROP TYPE "public"."ingestion_runs_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."ingestion_runs_status_enum_old" RENAME TO "ingestion_runs_status_enum"`);
    }

}
