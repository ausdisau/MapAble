-- Research-only proposal. Apply to an isolated approved Neon branch only.
BEGIN;
CREATE SCHEMA IF NOT EXISTS mapable_model_research;
CREATE TABLE IF NOT EXISTS mapable_model_research.training_runs (
  run_id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('queued','running','evaluated','failed','cancelled')),
  dataset_sha256 text NOT NULL CHECK (dataset_sha256 ~ '^[0-9a-f]{64}$'),
  weights_sha256 text CHECK (weights_sha256 IS NULL OR weights_sha256 ~ '^[0-9a-f]{64}$'),
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  synthetic_only boolean NOT NULL DEFAULT true CHECK (synthetic_only),
  production_approved boolean NOT NULL DEFAULT false CHECK (NOT production_approved)
);
REVOKE ALL ON SCHEMA mapable_model_research FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA mapable_model_research FROM PUBLIC;
COMMIT;
