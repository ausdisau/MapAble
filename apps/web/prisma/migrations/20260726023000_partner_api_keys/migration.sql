-- Partner API Program keys (B2B).
--
-- Empty-DB repair: 20260714130000_developer_platform incorrectly created the
-- developer-platform key table as "api_keys" (platform shape: clientId/keyHash).
-- Current schema maps that model to "platform_api_keys" and reserves "api_keys"
-- for partner program keys (partner_id/key_hash). Remap before creating the
-- partner table so migrate-from-zero does not fail with P3018/42P07.

DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'api_keys'
      AND column_name = 'clientId'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'platform_api_keys'
  ) THEN
    ALTER TABLE "api_keys" RENAME TO "platform_api_keys";
  END IF;
END $$;

DO $$ BEGIN
  ALTER INDEX IF EXISTS "api_keys_keyHash_idx" RENAME TO "platform_api_keys_keyHash_idx";
EXCEPTION WHEN undefined_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER INDEX IF EXISTS "api_keys_clientId_idx" RENAME TO "platform_api_keys_clientId_idx";
EXCEPTION WHEN undefined_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "platform_api_keys" RENAME CONSTRAINT "api_keys_pkey" TO "platform_api_keys_pkey";
EXCEPTION WHEN undefined_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "platform_api_keys" RENAME CONSTRAINT "api_keys_clientId_fkey" TO "platform_api_keys_clientId_fkey";
EXCEPTION WHEN undefined_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

-- Access-log FK previously targeted the platform-shaped table; drop before
-- creating partner "api_keys", then reattach to the partner table.
ALTER TABLE IF EXISTS "api_access_logs" DROP CONSTRAINT IF EXISTS "api_access_logs_apiKeyId_fkey";

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_partner_id_idx" ON "api_keys"("partner_id");

-- CreateIndex
CREATE INDEX "api_keys_partner_id_created_at_idx" ON "api_keys"("partner_id", "created_at");

DO $$ BEGIN
  ALTER TABLE "api_access_logs" ADD CONSTRAINT "api_access_logs_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;
