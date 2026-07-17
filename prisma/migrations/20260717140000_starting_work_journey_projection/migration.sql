-- Temporary Starting Work mission projection (not CareOSMission SoR; not a domain writer)

CREATE TABLE "starting_work_journey_projections" (
    "id" TEXT NOT NULL,
    "journey_id" TEXT NOT NULL,
    "participant_label" TEXT NOT NULL,
    "venue_label" TEXT NOT NULL,
    "participant_goal" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "block_reason" TEXT,
    "failure_mode" TEXT,
    "current_step" TEXT,
    "steps_completed_json" JSONB NOT NULL,
    "dependency_graph_json" JSONB NOT NULL,
    "state_honesty_json" JSONB NOT NULL,
    "notices_json" JSONB NOT NULL,
    "readiness_json" JSONB,
    "outcome_receipt_json" JSONB,
    "regional_candidates_json" JSONB NOT NULL,
    "regional_confirmed_json" JSONB NOT NULL,
    "entity_refs_json" JSONB NOT NULL,
    "actor_user_id" TEXT,
    "case_id" TEXT,
    "synthetic" BOOLEAN NOT NULL DEFAULT true,
    "production_claim" TEXT NOT NULL DEFAULT 'none',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "starting_work_journey_projections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "starting_work_journey_events" (
    "id" TEXT NOT NULL,
    "projection_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "step_id" TEXT,
    "payload_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "starting_work_journey_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "starting_work_journey_projections_journey_id_key" ON "starting_work_journey_projections"("journey_id");
CREATE INDEX "starting_work_journey_projections_status_created_at_idx" ON "starting_work_journey_projections"("status", "created_at");
CREATE INDEX "starting_work_journey_projections_actor_user_id_idx" ON "starting_work_journey_projections"("actor_user_id");
CREATE INDEX "starting_work_journey_events_projection_id_created_at_idx" ON "starting_work_journey_events"("projection_id", "created_at");

ALTER TABLE "starting_work_journey_events" ADD CONSTRAINT "starting_work_journey_events_projection_id_fkey" FOREIGN KEY ("projection_id") REFERENCES "starting_work_journey_projections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
