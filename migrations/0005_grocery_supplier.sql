-- Task #15: real grocery supplier catalogue (Open Food Facts AU)
-- Adds supplier provenance + price-source tracking to grocery_products and a
-- unique key on (supplier_source, supplier_product_id) so adapter sync upserts
-- cleanly. Idempotent: every column is added IF NOT EXISTS, the unique
-- constraint is created only if absent.

ALTER TABLE "grocery_products" ADD COLUMN IF NOT EXISTS "brand" varchar;
ALTER TABLE "grocery_products" ADD COLUMN IF NOT EXISTS "supplier_source" varchar DEFAULT 'seed' NOT NULL;
ALTER TABLE "grocery_products" ADD COLUMN IF NOT EXISTS "supplier_product_id" varchar;
ALTER TABLE "grocery_products" ADD COLUMN IF NOT EXISTS "supplier_url" varchar;
ALTER TABLE "grocery_products" ADD COLUMN IF NOT EXISTS "price_source" varchar DEFAULT 'manual' NOT NULL;
ALTER TABLE "grocery_products" ADD COLUMN IF NOT EXISTS "last_synced_at" timestamp;

DO $$ BEGIN
  ALTER TABLE "grocery_products"
    ADD CONSTRAINT "grocery_products_supplier_source_supplier_product_id_unique"
    UNIQUE ("supplier_source", "supplier_product_id");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
