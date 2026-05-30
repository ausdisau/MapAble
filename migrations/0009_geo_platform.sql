-- MapAble Geo Platform (task #21): unified geo data model
-- Idempotent so it can be applied safely alongside `drizzle-kit push`.

DO $$ BEGIN
  CREATE TYPE "geo_domain" AS ENUM ('accessibility', 'care', 'transport', 'employment');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "geo_visibility" AS ENUM ('public', 'staff', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "geo_geometry_type" AS ENUM ('Point', 'LineString', 'Polygon', 'MultiLineString', 'MultiPolygon');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "map_categories" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "icon" text,
  "color" text,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "map_layers" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "description" text,
  "domains" text[] NOT NULL DEFAULT ARRAY['accessibility']::text[],
  "visibility" "geo_visibility" NOT NULL DEFAULT 'public',
  "icon" text,
  "color" text,
  "attribution" text,
  "source_url" text,
  "geometry_type" "geo_geometry_type" NOT NULL DEFAULT 'Point',
  "default_visible" boolean NOT NULL DEFAULT true,
  "ordering" integer NOT NULL DEFAULT 100,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "map_features" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "layer_id" varchar NOT NULL,
  "category_id" varchar,
  "name" text NOT NULL,
  "description" text,
  "geometry" jsonb NOT NULL,
  "lat" text,
  "lng" text,
  "min_lat" text,
  "max_lat" text,
  "min_lng" text,
  "max_lng" text,
  "attributes" jsonb DEFAULT '{}'::jsonb,
  "source" text,
  "external_id" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "personal_places" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "name" text NOT NULL,
  "tag" text,
  "lat" text NOT NULL,
  "lng" text NOT NULL,
  "address" text,
  "notes" text,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "service_regions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "organization_id" varchar,
  "geometry" jsonb NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "worker_coverage_zones" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "worker_id" varchar NOT NULL,
  "mode" text NOT NULL DEFAULT 'polygon',
  "geometry" jsonb,
  "suburbs" text[],
  "center_lat" text,
  "center_lng" text,
  "radius_km" text,
  "max_travel_mins" integer,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "geo_audit_log" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar,
  "action" text NOT NULL,
  "entity" text NOT NULL,
  "entity_id" text,
  "payload" jsonb,
  "created_at" timestamp DEFAULT now()
);

-- Idempotent backfill: tag seeded layers with all relevant domains so the
-- Care / Transport / Employment domain tabs are populated (not just Accessibility).
-- Safe to re-run; only touches the known seed slugs.
UPDATE "map_layers" SET "domains" = ARRAY['accessibility','care','employment'] WHERE "slug" IN ('dpos','ndap');
UPDATE "map_layers" SET "domains" = ARRAY['accessibility','care','transport'] WHERE "slug" = 'mapable';
UPDATE "map_layers" SET "domains" = ARRAY['accessibility','transport'] WHERE "slug" IN ('mobility-parking','stairs','lifts','navability-routes');
UPDATE "map_layers" SET "domains" = ARRAY['accessibility','care'] WHERE "slug" = 'playgrounds';
