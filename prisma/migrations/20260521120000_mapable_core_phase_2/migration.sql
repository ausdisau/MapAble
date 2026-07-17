-- MapAble Core Phase 2 — incremental Booking provider-response fields.
-- Historical repair (remediation PR 1): create enum before use so migrate-from-zero
-- does not fail on missing type. Broader Phase 2 DDL historically relied on db push
-- stubs; see docs/remediation/MIGRATION_INVENTORY.md.

DO $$ BEGIN
  CREATE TYPE "ProviderResponseStatus" AS ENUM (
    'not_sent',
    'sent',
    'accepted',
    'declined',
    'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "providerResponseStatus" "ProviderResponseStatus" NOT NULL DEFAULT 'not_sent';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "providerResponseNote" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "providerRespondedAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "fundingSourceId" TEXT;
