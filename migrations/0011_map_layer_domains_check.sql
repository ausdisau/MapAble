-- Enforce that map_layers.domains only ever contains valid domain values and
-- always has at least one entry. Prevents typos/invalid imports from silently
-- hiding layers from every tab. Idempotent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'map_layers_domains_valid'
  ) THEN
    ALTER TABLE map_layers
      ADD CONSTRAINT map_layers_domains_valid
      CHECK (
        cardinality(domains) >= 1
        AND domains <@ ARRAY['accessibility','care','transport','employment']::text[]
      );
  END IF;
END $$;
