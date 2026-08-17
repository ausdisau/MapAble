-- NDIS export reuses outlet_key for multiple rows; keep a non-unique index only.

DROP INDEX IF EXISTS "provider_outlets_outlet_key_key";

CREATE INDEX IF NOT EXISTS "provider_outlets_outlet_key_idx"
    ON "provider_outlets"("outlet_key");
