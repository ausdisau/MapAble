-- Indoor accessibility platform (Iterations 2–14)

CREATE TYPE "AccessFloorPlanStatus" AS ENUM (
  'draft',
  'in_review',
  'changes_requested',
  'approved',
  'published',
  'superseded',
  'archived',
  'rejected'
);

CREATE TYPE "AccessFloorPlanVisibility" AS ENUM (
  'public',
  'authenticated',
  'restricted',
  'staffOnly'
);

CREATE TABLE "access_floor_plans" (
  "id" TEXT NOT NULL,
  "place_id" TEXT NOT NULL,
  "schema_version" INTEGER NOT NULL DEFAULT 1,
  "floor_code" TEXT NOT NULL,
  "floor_name" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "plan_asset_url" TEXT NOT NULL,
  "plan_asset_type" TEXT NOT NULL,
  "original_width" INTEGER NOT NULL,
  "original_height" INTEGER NOT NULL,
  "alt_text" TEXT,
  "orientation_label" TEXT,
  "is_to_scale" BOOLEAN NOT NULL DEFAULT false,
  "metres_per_plan_unit" DOUBLE PRECISION,
  "publication_status" "AccessFloorPlanStatus" NOT NULL DEFAULT 'draft',
  "visibility" "AccessFloorPlanVisibility" NOT NULL DEFAULT 'public',
  "source_name" TEXT,
  "source_url" TEXT,
  "licence_or_permission" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "verified_at" TIMESTAMP(3),
  "verified_by_type" TEXT,
  "published_at" TIMESTAMP(3),
  "superseded_at" TIMESTAMP(3),
  "structured_data" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "access_floor_plans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "access_floor_plans_place_id_publication_status_idx" ON "access_floor_plans"("place_id", "publication_status");

ALTER TABLE "access_floor_plans" ADD CONSTRAINT "access_floor_plans_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "floor_plan_correction_proposals" (
  "id" TEXT NOT NULL,
  "place_id" TEXT NOT NULL,
  "floor_plan_id" TEXT,
  "feature_id" TEXT,
  "correction_type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "proposed_changes" JSONB,
  "reporter_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "moderator_id" TEXT,
  "moderator_notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "floor_plan_correction_proposals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "floor_plan_correction_proposals_place_id_status_idx" ON "floor_plan_correction_proposals"("place_id", "status");

ALTER TABLE "floor_plan_correction_proposals" ADD CONSTRAINT "floor_plan_correction_proposals_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "indoor_accessibility_incidents" (
  "id" TEXT NOT NULL,
  "place_id" TEXT NOT NULL,
  "floor_plan_id" TEXT,
  "feature_id" TEXT,
  "incident_type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "trust_level" TEXT NOT NULL,
  "operational_status" TEXT NOT NULL DEFAULT 'unavailable',
  "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verified_at" TIMESTAMP(3),
  "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expected_resolution_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  "resolved_at" TIMESTAMP(3),
  "moderation_state" TEXT NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "indoor_accessibility_incidents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "indoor_accessibility_incidents_place_id_resolved_at_idx" ON "indoor_accessibility_incidents"("place_id", "resolved_at");

ALTER TABLE "indoor_accessibility_incidents" ADD CONSTRAINT "indoor_accessibility_incidents_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "visit_plans" (
  "id" TEXT NOT NULL,
  "owner_user_id" TEXT NOT NULL,
  "place_id" TEXT NOT NULL,
  "title" TEXT,
  "scheduled_at" TIMESTAMP(3),
  "payload" JSONB NOT NULL,
  "share_scopes" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "visit_plans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "visit_plans_owner_user_id_idx" ON "visit_plans"("owner_user_id");

ALTER TABLE "visit_plans" ADD CONSTRAINT "visit_plans_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "visit_plan_shares" (
  "id" TEXT NOT NULL,
  "visit_plan_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "scopes" JSONB NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "access_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "visit_plan_shares_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "visit_plan_shares_token_hash_key" ON "visit_plan_shares"("token_hash");
CREATE INDEX "visit_plan_shares_visit_plan_id_idx" ON "visit_plan_shares"("visit_plan_id");

ALTER TABLE "visit_plan_shares" ADD CONSTRAINT "visit_plan_shares_visit_plan_id_fkey" FOREIGN KEY ("visit_plan_id") REFERENCES "visit_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "indoor_checkpoints" (
  "id" TEXT NOT NULL,
  "place_id" TEXT NOT NULL,
  "floor_plan_id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "public_label" TEXT NOT NULL,
  "position" JSONB NOT NULL,
  "route_node_id" TEXT,
  "token_version" INTEGER NOT NULL DEFAULT 1,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "indoor_checkpoints_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "indoor_checkpoints_place_id_active_idx" ON "indoor_checkpoints"("place_id", "active");

ALTER TABLE "indoor_checkpoints" ADD CONSTRAINT "indoor_checkpoints_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "partner_api_clients" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "scopes" TEXT[],
  "key_hash" TEXT NOT NULL,
  "key_prefix" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "rate_limit" INTEGER NOT NULL DEFAULT 100,
  "allowed_origins" TEXT[],
  "last_used_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "partner_api_clients_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "partner_api_clients_key_hash_key" ON "partner_api_clients"("key_hash");

CREATE TABLE "accessibility_preference_profiles" (
  "id" TEXT NOT NULL,
  "user_id" TEXT,
  "session_key" TEXT,
  "preferences" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "accessibility_preference_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accessibility_preference_profiles_user_id_key" ON "accessibility_preference_profiles"("user_id");
CREATE UNIQUE INDEX "accessibility_preference_profiles_session_key_key" ON "accessibility_preference_profiles"("session_key");
