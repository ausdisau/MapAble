-- NDIS provider outlet registry (imported from public/data/provider-outlets.json).
-- Exposed via Supabase Data API: RLS limits reads to active outlets only.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS public.provider_outlets (
  id TEXT NOT NULL,
  abn TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT,
  outlet_key TEXT,
  outlet_name TEXT,
  flag TEXT,
  active BOOLEAN NOT NULL DEFAULT false,
  phone TEXT,
  website TEXT,
  email TEXT,
  address TEXT,
  head_office TEXT,
  state TEXT NOT NULL,
  postcode TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  reg_group INTEGER[] NOT NULL DEFAULT '{}',
  opening_hours TEXT,
  professions TEXT,
  raw JSONB NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT provider_outlets_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS provider_outlets_outlet_key_idx
  ON public.provider_outlets (outlet_key)
  WHERE outlet_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS provider_outlets_active_idx
  ON public.provider_outlets (active)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS provider_outlets_state_idx ON public.provider_outlets (state);
CREATE INDEX IF NOT EXISTS provider_outlets_abn_idx ON public.provider_outlets (abn);
CREATE INDEX IF NOT EXISTS provider_outlets_name_idx ON public.provider_outlets (name);

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS provider_outlets_name_trgm
    ON public.provider_outlets USING gin (name gin_trgm_ops);
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE public.provider_outlets ENABLE ROW LEVEL SECURITY;

-- Public read: active NDIS-registered outlets only (import script uses service role).
CREATE POLICY provider_outlets_select_active
  ON public.provider_outlets
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- No INSERT/UPDATE/DELETE for anon/authenticated (service role bypasses RLS).

CREATE OR REPLACE FUNCTION public.provider_outlets_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS provider_outlets_updated_at ON public.provider_outlets;
CREATE TRIGGER provider_outlets_updated_at
  BEFORE UPDATE ON public.provider_outlets
  FOR EACH ROW
  EXECUTE FUNCTION public.provider_outlets_set_updated_at();
