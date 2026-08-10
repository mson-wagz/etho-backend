import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSitesToReviewTable1773222895173 implements MigrationInterface {
    name = 'CreateSitesToReviewTable1773222895173'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."sites_to_review_status_enum" AS ENUM('pending', 'awaiting_review', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "sites_to_review" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" text NOT NULL, "domain" text NOT NULL, "title" text, "snippet" text, "category" text, "marketplace_confidence" numeric(5,2) NOT NULL DEFAULT '0', "ethical_indicators" jsonb NOT NULL DEFAULT '[]', "robots_txt_allows_scraping" boolean, "robots_txt_details" text, "tos_allows_scraping" boolean, "tos_details" text, "tos_url" text, "is_scrapable" boolean, "discovery_reasoning" text, "status" "public"."sites_to_review_status_enum" NOT NULL DEFAULT 'pending', "discovered_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "reviewed_at" TIMESTAMP WITH TIME ZONE, "review_notes" text, CONSTRAINT "UQ_3fc5b1d5af18817f34e062156c0" UNIQUE ("domain"), CONSTRAINT "PK_dbe8f51fbefd2f8609c5763cd02" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_sites_to_review_confidence" ON "sites_to_review" ("marketplace_confidence") `);
        await queryRunner.query(`CREATE INDEX "idx_sites_to_review_status" ON "sites_to_review" ("status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_sites_to_review_domain" ON "sites_to_review" ("domain") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_sites_to_review_domain"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sites_to_review_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sites_to_review_confidence"`);
        await queryRunner.query(`DROP TABLE "sites_to_review"`);
        await queryRunner.query(`DROP TYPE "public"."sites_to_review_status_enum"`);
    }

}
