import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1767800371496 implements MigrationInterface {
  name = 'InitialMigration1767800371496';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "slug" character varying(100) NOT NULL, "parent_id" uuid, "path" text array NOT NULL, "level" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE ("slug"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_categories_level" ON "categories" ("level") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_categories_slug" ON "categories" ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_categories_path" ON "categories" ("path") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_categories_parent" ON "categories" ("parent_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "product_variant_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "name" character varying(50) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_54d5c3cbce46e6919313d712e32" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_option_types_product" ON "product_variant_types" ("product_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "option_choices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "option_type_id" uuid NOT NULL, "choice" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_589727e4756234a74802aeeedd9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_option_choices_option_type" ON "option_choices" ("option_type_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "variant_option_selections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_variant_id" uuid NOT NULL, "option_choice_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c7e7100f7be444ac7c11d1aded2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "unique_variant_choice" ON "variant_option_selections" ("product_variant_id", "option_choice_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_variant_option_selections_choice" ON "variant_option_selections" ("option_choice_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_variant_option_selections_variant" ON "variant_option_selections" ("product_variant_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."product_variants_availability_enum" AS ENUM('in_stock', 'out_of_stock', 'preorder')`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_variants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "images" text array NOT NULL, "price" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'USD', "compare_at_price" numeric(10,2), "availability" "public"."product_variants_availability_enum" NOT NULL DEFAULT 'in_stock', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_281e3f2c55652d6a22c0aa59fd7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_variants_product" ON "product_variants" ("product_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "product_certifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "certification_id" uuid NOT NULL, "detected_from" character varying(50) NOT NULL, "assigned_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d369317135cb1047e6046a86b8f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "certifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filter_id" uuid, "name" character varying(100) NOT NULL, "slug" character varying(100) NOT NULL, "certifying_body" character varying(100) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9eb29158fdc27b227a71c7f138c" UNIQUE ("name"), CONSTRAINT "UQ_df1a8f70676d03f15e1c85000e6" UNIQUE ("slug"), CONSTRAINT "PK_fd763d412e4a1fb1b6dadd6e72b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_certifications_slug" ON "certifications" ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_certifications_filter" ON "certifications" ("filter_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."filters_tier_enum" AS ENUM('primary', 'secondary')`,
    );
    await queryRunner.query(
      `CREATE TABLE "filters" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "slug" character varying(100) NOT NULL, "tier" "public"."filters_tier_enum" NOT NULL, "keywords" text NOT NULL, "description" text NOT NULL, "priority" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0a3564db8ce9b0dcb991598944c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_filters_priority" ON "filters" ("priority") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_filters_tier" ON "filters" ("tier") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "unique_tier_slug" ON "filters" ("tier", "slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "product_filters" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "filter_id" uuid NOT NULL, "confidence_score" numeric(3,2) NOT NULL, "percentage" integer, "evidence_text" text array, "source" character varying(50) NOT NULL, "assigned_at" TIMESTAMP NOT NULL DEFAULT now(), "assigned_by" character varying(50) NOT NULL DEFAULT 'llm', CONSTRAINT "PK_14ea310a31a40fc423c23ba0116" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_filters_filter" ON "product_filters" ("filter_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_filters_product" ON "product_filters" ("product_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."analytics_events_event_type_enum" AS ENUM('PRODUCT_VIEWED', 'PRODUCT_ADDED_TO_CART', 'CLICK_THROUGH', 'SEARCH_PERFORMED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "analytics_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "event_type" "public"."analytics_events_event_type_enum" NOT NULL, "product_id" uuid, "metadata" jsonb DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5d643d67a09b55653e98616f421" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_analytics_events_product" ON "analytics_events" ("product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_analytics_events_type" ON "analytics_events" ("event_type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "redirect_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid, "product_id" uuid NOT NULL, "source_page" character varying(100), "destination_url" text NOT NULL, "clicked_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ef334501910ad7ebbd231eef382" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_redirect_events_product" ON "redirect_events" ("product_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "brand_id" uuid NOT NULL, "name" character varying(500) NOT NULL, "slug" character varying(500) NOT NULL, "description" text, "category_id" uuid NOT NULL, "materials" text array, "extraction_method" character varying(50), "extraction_confidence" character varying(20), "filter_confidence" numeric(3,2), "scraped_at" TIMESTAMP, "filtered_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "search_vector" tsvector, "product_content_hash" character varying(100) NOT NULL, "availability" character varying(100), "source_url" text, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_search_vector" ON "products" ("search_vector") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_category" ON "products" ("category_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_brand" ON "products" ("brand_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "scraping_sources" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "brand_id" uuid NOT NULL, "config" jsonb NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "last_successful_scrape" TIMESTAMP, "last_error" text, "success_count" integer NOT NULL DEFAULT '0', "failure_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_b4899388044cdab66d78af8a57" UNIQUE ("brand_id"), CONSTRAINT "PK_5b89f0bf1a2ff541ce10a4c7daa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_scraping_sources_last_scrape" ON "scraping_sources" ("last_successful_scrape") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_scraping_sources_is_active" ON "scraping_sources" ("is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_scraping_sources_brand" ON "scraping_sources" ("brand_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ingestion_runs_run_type_enum" AS ENUM('manual', 'scheduled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ingestion_runs_status_enum" AS ENUM('standby', 'in_progress', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ingestion_runs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "brand_id" uuid, "scraping_source_id" uuid, "run_type" "public"."ingestion_runs_run_type_enum" NOT NULL DEFAULT 'scheduled', "status" "public"."ingestion_runs_status_enum" NOT NULL DEFAULT 'standby', "products_fetched" integer NOT NULL DEFAULT '0', "products_added" integer NOT NULL DEFAULT '0', "products_updated" integer NOT NULL DEFAULT '0', "products_excluded" integer NOT NULL DEFAULT '0', "errors_count" integer NOT NULL DEFAULT '0', "errors" jsonb, "started_at" TIMESTAMP NOT NULL DEFAULT now(), "completed_at" TIMESTAMP, "duration_seconds" integer, CONSTRAINT "PK_e9476c02c52a0dac026b859858a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ingestion_runs_run_type" ON "ingestion_runs" ("run_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ingestion_runs_status" ON "ingestion_runs" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ingestion_runs_started_at" ON "ingestion_runs" ("started_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ingestion_runs_source" ON "ingestion_runs" ("scraping_source_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ingestion_runs_brand" ON "ingestion_runs" ("brand_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "brands" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "website_url" text NOT NULL, "description" text, "last_scraped_at" TIMESTAMP, "scrape_status" character varying(50), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b0c437120b624da1034a81fc561" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_brands_last_scraped" ON "brands" ("last_scraped_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_brands_scrape_status" ON "brands" ("scrape_status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "unique_brand_name" ON "brands" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "search_queries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid, "query" text NOT NULL, "results_count" integer NOT NULL DEFAULT '0', "filters_applied" jsonb, "searched_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2945172d2d9a9f6b2339dd036e7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_search_queries_session" ON "search_queries" ("session_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_search_queries_searched_at" ON "search_queries" ("searched_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_search_queries_query" ON "search_queries" ("query") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'shopper', 'ethical_brand_partner')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "name" character varying(255), "password_hash" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'shopper', "is_active" boolean NOT NULL DEFAULT true, "email_verified" boolean NOT NULL DEFAULT false, "last_login_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_role" ON "users" ("role") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_is_active" ON "users" ("is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_email" ON "users" ("email") `,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_88cea2dc9c31951d06437879b40" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variant_types" ADD CONSTRAINT "FK_574c44732c1d598af1699512b6d" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "option_choices" ADD CONSTRAINT "FK_0e5d5065500a8dee47422ecfa0b" FOREIGN KEY ("option_type_id") REFERENCES "product_variant_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "variant_option_selections" ADD CONSTRAINT "FK_9a0274dc53ffe12922fc356dd04" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "variant_option_selections" ADD CONSTRAINT "FK_50505a25edbbed0933e5fd32813" FOREIGN KEY ("option_choice_id") REFERENCES "option_choices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ADD CONSTRAINT "FK_6343513e20e2deab45edfce1316" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_certifications" ADD CONSTRAINT "FK_4ac2b9fb94b2cbe43d0fe493c80" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_certifications" ADD CONSTRAINT "FK_a42f201d71c685db11bbd192926" FOREIGN KEY ("certification_id") REFERENCES "certifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "certifications" ADD CONSTRAINT "FK_defb1cc5e45fd547894db9a8def" FOREIGN KEY ("filter_id") REFERENCES "filters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_filters" ADD CONSTRAINT "FK_b4076ec9c2e2d1f95acf01ddfe9" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_filters" ADD CONSTRAINT "FK_3fa14496110587b7ddaf5980807" FOREIGN KEY ("filter_id") REFERENCES "filters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "analytics_events" ADD CONSTRAINT "FK_a80d4c8a9c216ed6647a8e8f38c" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "redirect_events" ADD CONSTRAINT "FK_e8c7e532dc6a768bc838db84ecf" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_1530a6f15d3c79d1b70be98f2be" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scraping_sources" ADD CONSTRAINT "FK_b4899388044cdab66d78af8a573" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingestion_runs" ADD CONSTRAINT "FK_6f76b6340b7b1cdb86543fe685c" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingestion_runs" ADD CONSTRAINT "FK_4f3f85371fcba4e9c3654676f3c" FOREIGN KEY ("scraping_source_id") REFERENCES "scraping_sources"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ingestion_runs" DROP CONSTRAINT "FK_4f3f85371fcba4e9c3654676f3c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingestion_runs" DROP CONSTRAINT "FK_6f76b6340b7b1cdb86543fe685c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "scraping_sources" DROP CONSTRAINT "FK_b4899388044cdab66d78af8a573"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_1530a6f15d3c79d1b70be98f2be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "redirect_events" DROP CONSTRAINT "FK_e8c7e532dc6a768bc838db84ecf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "analytics_events" DROP CONSTRAINT "FK_a80d4c8a9c216ed6647a8e8f38c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_filters" DROP CONSTRAINT "FK_3fa14496110587b7ddaf5980807"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_filters" DROP CONSTRAINT "FK_b4076ec9c2e2d1f95acf01ddfe9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certifications" DROP CONSTRAINT "FK_defb1cc5e45fd547894db9a8def"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_certifications" DROP CONSTRAINT "FK_a42f201d71c685db11bbd192926"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_certifications" DROP CONSTRAINT "FK_4ac2b9fb94b2cbe43d0fe493c80"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" DROP CONSTRAINT "FK_6343513e20e2deab45edfce1316"`,
    );
    await queryRunner.query(
      `ALTER TABLE "variant_option_selections" DROP CONSTRAINT "FK_50505a25edbbed0933e5fd32813"`,
    );
    await queryRunner.query(
      `ALTER TABLE "variant_option_selections" DROP CONSTRAINT "FK_9a0274dc53ffe12922fc356dd04"`,
    );
    await queryRunner.query(
      `ALTER TABLE "option_choices" DROP CONSTRAINT "FK_0e5d5065500a8dee47422ecfa0b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variant_types" DROP CONSTRAINT "FK_574c44732c1d598af1699512b6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_88cea2dc9c31951d06437879b40"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_users_email"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_is_active"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_role"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_search_queries_query"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_search_queries_searched_at"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_search_queries_session"`);
    await queryRunner.query(`DROP TABLE "search_queries"`);
    await queryRunner.query(`DROP INDEX "public"."unique_brand_name"`);
    await queryRunner.query(`DROP INDEX "public"."idx_brands_scrape_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_brands_last_scraped"`);
    await queryRunner.query(`DROP TABLE "brands"`);
    await queryRunner.query(`DROP INDEX "public"."idx_ingestion_runs_brand"`);
    await queryRunner.query(`DROP INDEX "public"."idx_ingestion_runs_source"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_ingestion_runs_started_at"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_ingestion_runs_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_ingestion_runs_run_type"`,
    );
    await queryRunner.query(`DROP TABLE "ingestion_runs"`);
    await queryRunner.query(`DROP TYPE "public"."ingestion_runs_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."ingestion_runs_run_type_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_scraping_sources_brand"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_scraping_sources_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_scraping_sources_last_scrape"`,
    );
    await queryRunner.query(`DROP TABLE "scraping_sources"`);
    await queryRunner.query(`DROP INDEX "public"."idx_products_brand"`);
    await queryRunner.query(`DROP INDEX "public"."idx_products_category"`);
    await queryRunner.query(`DROP INDEX "public"."idx_products_search_vector"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_redirect_events_product"`,
    );
    await queryRunner.query(`DROP TABLE "redirect_events"`);
    await queryRunner.query(`DROP INDEX "public"."idx_analytics_events_type"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_analytics_events_product"`,
    );
    await queryRunner.query(`DROP TABLE "analytics_events"`);
    await queryRunner.query(
      `DROP TYPE "public"."analytics_events_event_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_filters_product"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_product_filters_filter"`);
    await queryRunner.query(`DROP TABLE "product_filters"`);
    await queryRunner.query(`DROP INDEX "public"."unique_tier_slug"`);
    await queryRunner.query(`DROP INDEX "public"."idx_filters_tier"`);
    await queryRunner.query(`DROP INDEX "public"."idx_filters_priority"`);
    await queryRunner.query(`DROP TABLE "filters"`);
    await queryRunner.query(`DROP TYPE "public"."filters_tier_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_certifications_filter"`);
    await queryRunner.query(`DROP INDEX "public"."idx_certifications_slug"`);
    await queryRunner.query(`DROP TABLE "certifications"`);
    await queryRunner.query(`DROP TABLE "product_certifications"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_variants_product"`,
    );
    await queryRunner.query(`DROP TABLE "product_variants"`);
    await queryRunner.query(
      `DROP TYPE "public"."product_variants_availability_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_variant_option_selections_variant"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_variant_option_selections_choice"`,
    );
    await queryRunner.query(`DROP INDEX "public"."unique_variant_choice"`);
    await queryRunner.query(`DROP TABLE "variant_option_selections"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_option_choices_option_type"`,
    );
    await queryRunner.query(`DROP TABLE "option_choices"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_option_types_product"`,
    );
    await queryRunner.query(`DROP TABLE "product_variant_types"`);
    await queryRunner.query(`DROP INDEX "public"."idx_categories_parent"`);
    await queryRunner.query(`DROP INDEX "public"."idx_categories_path"`);
    await queryRunner.query(`DROP INDEX "public"."idx_categories_slug"`);
    await queryRunner.query(`DROP INDEX "public"."idx_categories_level"`);
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
