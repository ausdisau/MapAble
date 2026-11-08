-- Additive and inert until a source release is manually validated and activated.
-- A separate Commission register snapshot. Existing NDIA/outlet and worker tables are untouched.
CREATE TABLE "ndis_commission_releases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_url" TEXT NOT NULL,
    "source_hash" TEXT NOT NULL,
    "source_as_of" DATE NOT NULL,
    "header_names" TEXT[] NOT NULL,
    "column_map" JSONB NOT NULL,
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'staging',
    "reviewed_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validated_at" TIMESTAMPTZ(6),
    "activated_at" TIMESTAMPTZ(6),
    CONSTRAINT "ndis_commission_releases_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ndis_commission_releases_status_check"
        CHECK ("status" IN ('staging', 'validated', 'rejected', 'active', 'retired')),
    CONSTRAINT "ndis_commission_releases_nonnegative_count" CHECK ("row_count" >= 0)
);
CREATE UNIQUE INDEX "ndis_commission_releases_source_hash_key"
    ON "ndis_commission_releases"("source_hash");
-- At most one public snapshot. Activation and retirement happen in one transaction.
CREATE UNIQUE INDEX "ndis_commission_one_active_idx"
    ON "ndis_commission_releases" ((1)) WHERE "status" = 'active';

CREATE TABLE "ndis_commission_entries" (
    "release_id" UUID NOT NULL,
    "row_number" INTEGER NOT NULL,
    "abn" TEXT,
    "registration_number" TEXT,
    "legal_name" TEXT NOT NULL,
    "business_name" TEXT,
    "registration_status" TEXT NOT NULL,
    "state" TEXT,
    "raw" JSONB NOT NULL,
    CONSTRAINT "ndis_commission_entries_pkey" PRIMARY KEY ("release_id", "row_number"),
    CONSTRAINT "ndis_commission_entries_release_id_fkey" FOREIGN KEY ("release_id")
        REFERENCES "ndis_commission_releases"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ndis_commission_entries_status_check"
        CHECK ("registration_status" IN ('Approved','Suspended','Revoked'))
);
CREATE INDEX "ndis_commission_entries_release_id_status_idx"
    ON "ndis_commission_entries"("release_id", "registration_status");
CREATE INDEX "ndis_commission_entries_release_id_abn_idx"
    ON "ndis_commission_entries"("release_id", "abn");
CREATE INDEX "ndis_commission_entries_release_id_state_idx"
    ON "ndis_commission_entries"("release_id", "state");
