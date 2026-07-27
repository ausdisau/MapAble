-- Additive columns/relations required by CareOS agent code absorbed in #442

ALTER TABLE "CareShift" ADD COLUMN IF NOT EXISTS "missionId" TEXT;
ALTER TABLE "CareShift" ADD COLUMN IF NOT EXISTS "workerAcceptanceStatus" TEXT NOT NULL DEFAULT 'pending';
CREATE INDEX IF NOT EXISTS "CareShift_missionId_idx" ON "CareShift"("missionId");

ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "workplaceLocationId" TEXT;
CREATE INDEX IF NOT EXISTS "Job_workplaceLocationId_idx" ON "Job"("workplaceLocationId");

ALTER TABLE "transport_trips" ADD COLUMN IF NOT EXISTS "returnAssuranceStatus" TEXT;

ALTER TABLE "participant_authority_grants" ADD COLUMN IF NOT EXISTS "delegateId" TEXT;
ALTER TABLE "participant_authority_grants" ADD COLUMN IF NOT EXISTS "domain" TEXT NOT NULL DEFAULT 'general';
ALTER TABLE "participant_authority_grants" ADD COLUMN IF NOT EXISTS "actions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "participant_authority_grants" ADD COLUMN IF NOT EXISTS "consentScopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "participant_authority_grants" ADD COLUMN IF NOT EXISTS "recipientRole" TEXT;

CREATE TABLE IF NOT EXISTS "platform_api_keys" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scopes" "ApiScope"[],
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "platform_api_keys_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "platform_api_keys_keyHash_idx" ON "platform_api_keys"("keyHash");
CREATE INDEX IF NOT EXISTS "platform_api_keys_clientId_idx" ON "platform_api_keys"("clientId");

-- FKs (ignore if already present / table names differ in some envs)
DO $$ BEGIN
  ALTER TABLE "CareShift" ADD CONSTRAINT "CareShift_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Job" ADD CONSTRAINT "Job_workplaceLocationId_fkey" FOREIGN KEY ("workplaceLocationId") REFERENCES "workplace_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "participant_authority_grants" ADD CONSTRAINT "participant_authority_grants_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "platform_api_keys" ADD CONSTRAINT "platform_api_keys_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "api_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;
