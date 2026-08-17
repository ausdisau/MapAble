-- NDIS provider finder ingestion (directory input; not MapAble registration verification).

CREATE TABLE "ndis_provider_ingestion_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_url" TEXT NOT NULL,
    "source_hash" TEXT NOT NULL,
    "provider_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(6),

    CONSTRAINT "ndis_provider_ingestion_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ndis_provider_ingestion_runs_started_at_idx"
    ON "ndis_provider_ingestion_runs"("started_at");

CREATE INDEX "ndis_provider_ingestion_runs_status_idx"
    ON "ndis_provider_ingestion_runs"("status");

CREATE TABLE "ndis_providers" (
    "source_id" TEXT NOT NULL,
    "provider_name" TEXT NOT NULL,
    "legal_name" TEXT,
    "abn" TEXT,
    "registration_number" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "suburb" TEXT,
    "state" TEXT,
    "postcode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "services" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "registration_groups" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "raw" JSONB NOT NULL,
    "raw_hash" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "source_updated_at" TIMESTAMPTZ(6),
    "ingested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ndis_providers_pkey" PRIMARY KEY ("source_id")
);

CREATE INDEX "ndis_providers_state_idx" ON "ndis_providers"("state");
CREATE INDEX "ndis_providers_postcode_idx" ON "ndis_providers"("postcode");

CREATE INDEX "ndis_providers_services_gin_idx"
    ON "ndis_providers" USING GIN ("services");

CREATE INDEX "ndis_providers_registration_groups_gin_idx"
    ON "ndis_providers" USING GIN ("registration_groups");

CREATE INDEX "ndis_providers_name_fts_idx"
    ON "ndis_providers"
    USING GIN (to_tsvector('english', "provider_name"));
