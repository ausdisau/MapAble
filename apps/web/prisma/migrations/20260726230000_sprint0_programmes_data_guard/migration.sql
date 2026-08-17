-- Sprint 0 data guard: GIN on affectedProgrammes, rating CHECK, RESTRICT user FKs,
-- and programme_registry_entries seeded from PROGRAMME_IDS.

-- CreateTable
CREATE TABLE "programme_registry_entries" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programme_registry_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "programme_registry_entries_enabled_sortOrder_idx" ON "programme_registry_entries"("enabled", "sortOrder");

-- Seed programme registry (mirrors lib/programmes/safety-invariants.ts PROGRAMME_IDS)
INSERT INTO "programme_registry_entries" ("id", "label", "enabled", "sortOrder", "createdAt", "updatedAt") VALUES
  ('pathways', 'Pathways', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('transition_home', 'Transition Home', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('kids', 'Kids', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lifespan', 'Lifespan', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('home', 'Home', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('at_lifecycle', 'AT Lifecycle', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('work_retention', 'Work Retention', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('carer_continuity', 'Carer Continuity', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('regional_capacity', 'Regional Capacity', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('rights_navigator', 'Rights Navigator', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('integration_foundry', 'Integration Foundry', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('data_cooperative', 'Data Cooperative', true, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- GIN index for array-containment queries on affectedProgrammes
CREATE INDEX "programme_source_records_affectedProgrammes_gin_idx"
  ON "programme_source_records" USING GIN ("affectedProgrammes");

-- Rating bounds for navigator feedback
ALTER TABLE "navigator_feedback"
  ADD CONSTRAINT "navigator_feedback_rating_range_check"
  CHECK ("rating" IS NULL OR ("rating" >= 1 AND "rating" <= 5));

-- Data guard: user-facing FKs RESTRICT (preserve audit/compliance history)
ALTER TABLE "navigator_assignments" DROP CONSTRAINT "navigator_assignments_participantId_fkey";
ALTER TABLE "navigator_assignments" ADD CONSTRAINT "navigator_assignments_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "navigator_assignments" DROP CONSTRAINT "navigator_assignments_navigatorId_fkey";
ALTER TABLE "navigator_assignments" ADD CONSTRAINT "navigator_assignments_navigatorId_fkey"
  FOREIGN KEY ("navigatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "navigator_feedback" DROP CONSTRAINT "navigator_feedback_participantId_fkey";
ALTER TABLE "navigator_feedback" ADD CONSTRAINT "navigator_feedback_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "service_relationship_records" DROP CONSTRAINT "service_relationship_records_participantId_fkey";
ALTER TABLE "service_relationship_records" ADD CONSTRAINT "service_relationship_records_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
