-- Additive versioned NDIS Provider Finder organisation/outlet importer.
-- Does not modify legacy ndis_providers/provider_outlets or billing.
CREATE TABLE "ndis_directory_import_runs" (
  "id" UUID NOT NULL,
  "source_mode" TEXT NOT NULL,
  "source_url" TEXT NOT NULL,
  "source_sha256" TEXT NOT NULL,
  "source_date" TEXT,
  "source_bytes" INTEGER NOT NULL,
  "input_row_count" INTEGER NOT NULL,
  "recognised_rows" INTEGER NOT NULL,
  "rejected_rows" INTEGER NOT NULL,
  "organisation_count" INTEGER NOT NULL,
  "outlet_count" INTEGER NOT NULL,
  "warnings" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "status" TEXT NOT NULL,
  "operator" TEXT NOT NULL,
  "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMPTZ(6),
  "error_code" TEXT,
  CONSTRAINT "ndis_directory_import_runs_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ndis_directory_organisations" (
  "run_id" UUID NOT NULL,
  "organisation_key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "abn" TEXT,
  "identity_basis" TEXT NOT NULL,
  "registration_groups" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  CONSTRAINT "ndis_directory_organisations_pkey" PRIMARY KEY ("run_id","organisation_key")
);
CREATE TABLE "ndis_directory_outlets" (
  "run_id" UUID NOT NULL,
  "outlet_key" TEXT NOT NULL,
  "organisation_key" TEXT NOT NULL,
  "outlet_name" TEXT NOT NULL,
  "address" TEXT,
  "head_office" TEXT,
  "suburb" TEXT,
  "state" TEXT,
  "postcode" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "phone" TEXT,
  "email" TEXT,
  "website" TEXT,
  "flag" TEXT,
  "source_active_flag" BOOLEAN,
  "registration_groups" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "professions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "opening_hours" TEXT,
  "record_hash" TEXT NOT NULL,
  "raw" JSONB NOT NULL,
  CONSTRAINT "ndis_directory_outlets_pkey" PRIMARY KEY ("run_id","outlet_key")
);
CREATE TABLE "ndis_directory_publications" (
  "code" TEXT NOT NULL,
  "run_id" UUID NOT NULL,
  "published_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "published_by" TEXT NOT NULL,
  CONSTRAINT "ndis_directory_publications_pkey" PRIMARY KEY ("code")
);

CREATE INDEX "ndis_directory_import_runs_status_started_at_idx" ON "ndis_directory_import_runs"("status","started_at");
CREATE INDEX "ndis_directory_import_runs_source_sha256_idx" ON "ndis_directory_import_runs"("source_sha256");
CREATE INDEX "ndis_directory_organisations_abn_idx" ON "ndis_directory_organisations"("abn");
CREATE INDEX "ndis_directory_outlets_run_id_state_postcode_idx" ON "ndis_directory_outlets"("run_id","state","postcode");
CREATE INDEX "ndis_directory_outlets_run_id_organisation_key_idx" ON "ndis_directory_outlets"("run_id","organisation_key");

ALTER TABLE "ndis_directory_organisations" ADD CONSTRAINT "ndis_directory_organisations_run_id_fkey"
FOREIGN KEY ("run_id") REFERENCES "ndis_directory_import_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ndis_directory_outlets" ADD CONSTRAINT "ndis_directory_outlets_run_id_organisation_key_fkey"
FOREIGN KEY ("run_id","organisation_key") REFERENCES "ndis_directory_organisations"("run_id","organisation_key") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ndis_directory_publications" ADD CONSTRAINT "ndis_directory_publications_run_id_fkey"
FOREIGN KEY ("run_id") REFERENCES "ndis_directory_import_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
