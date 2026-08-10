import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFullTextSearch1767964159700 implements MigrationInterface {
  name = 'AddFullTextSearch1767964159700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_products_search_vector"`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_products_search_vector_gin" ON "products" USING GIN ("search_vector")`,
    );

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION products_search_vector_update()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.search_vector := 
              setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
              setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B');
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER products_search_vector_trigger
      BEFORE INSERT OR UPDATE
      ON products
      FOR EACH ROW
      EXECUTE FUNCTION products_search_vector_update();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS products_search_vector_trigger ON products`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS products_search_vector_update()`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_products_search_vector_gin"`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_products_search_vector" ON "products" ("search_vector")`,
    );
  }
}
