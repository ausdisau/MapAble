-- Local Prisma store for NDIS provider finder list-providers.json export.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS "provider_outlets" (
    "id" TEXT NOT NULL,
    "abn" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "outlet_key" TEXT,
    "outlet_name" TEXT,
    "flag" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "website" TEXT,
    "email" TEXT,
    "address" TEXT,
    "head_office" TEXT,
    "state" TEXT NOT NULL,
    "postcode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "reg_group" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "opening_hours" TEXT,
    "professions" TEXT,
    "raw" JSONB NOT NULL,
    "source_date" TEXT,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_outlets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "provider_outlets_outlet_key_idx"
    ON "provider_outlets"("outlet_key");

CREATE INDEX IF NOT EXISTS "provider_outlets_active_idx" ON "provider_outlets"("active");
CREATE INDEX IF NOT EXISTS "provider_outlets_state_idx" ON "provider_outlets"("state");
CREATE INDEX IF NOT EXISTS "provider_outlets_abn_idx" ON "provider_outlets"("abn");
CREATE INDEX IF NOT EXISTS "provider_outlets_name_idx" ON "provider_outlets"("name");

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "provider_outlets_name_trgm"
    ON "provider_outlets" USING gin ("name" gin_trgm_ops);
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
