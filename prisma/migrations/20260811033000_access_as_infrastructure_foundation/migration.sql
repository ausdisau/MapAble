-- Access as Infrastructure foundation (additive).
-- Flag-gated writers; does not replace access_places.

CREATE TYPE "AccessDomain" AS ENUM (
  'mobility_movement',
  'reach_strength_dexterity',
  'seating_stamina',
  'vision',
  'hearing',
  'speech_communication',
  'auslan_language',
  'cognition_learning',
  'executive_memory',
  'sensory_regulation',
  'psychosocial',
  'pain_fatigue_fluctuating',
  'self_care_continence',
  'equipment_at',
  'assistance_animals',
  'digital',
  'service_staff',
  'financial_admin',
  'transport',
  'emergency'
);

CREATE TYPE "AccessCriticality" AS ENUM ('required', 'strong_preference', 'preference');
CREATE TYPE "AccessContextScope" AS ENUM ('always', 'activity_specific', 'journey_specific');
CREATE TYPE "AccessTiming" AS ENUM ('permanent', 'temporary', 'fluctuating');
CREATE TYPE "AccessAssistanceMode" AS ENUM ('independent', 'optional', 'required');
CREATE TYPE "AccessProvenanceStatus" AS ENUM (
  'verified',
  'observed',
  'venue_reported',
  'community_reported',
  'unknown',
  'outdated',
  'disputed'
);
CREATE TYPE "AccessCompatibilityState" AS ENUM (
  'compatible',
  'compatible_with_adjustment',
  'uncertain',
  'incompatible'
);
CREATE TYPE "AccessEntityType" AS ENUM (
  'place',
  'footpath',
  'transport_stop',
  'vehicle',
  'support_provider',
  'workplace',
  'school',
  'hospital',
  'event',
  'park',
  'accommodation',
  'digital_service',
  'path_segment',
  'entrance',
  'amenity',
  'other'
);
CREATE TYPE "AccessJourneySegmentKind" AS ENUM (
  'preparation',
  'origin',
  'path_to_transport',
  'pickup_or_station',
  'boarding',
  'vehicle',
  'interchange',
  'drop_off',
  'path_to_destination',
  'entrance',
  'internal_movement',
  'service_or_activity',
  'amenities',
  'return_journey'
);
CREATE TYPE "AccessPassportVisibility" AS ENUM ('private', 'request_scoped', 'approved_service');

CREATE TABLE "access_passports" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "visibility_default" "AccessPassportVisibility" NOT NULL DEFAULT 'private',
  "contains_diagnosis" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "access_passports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "access_passports_user_id_key" ON "access_passports"("user_id");

CREATE TABLE "access_requirement_records" (
  "id" TEXT NOT NULL,
  "passport_id" TEXT NOT NULL,
  "ontology_concept_id" TEXT NOT NULL,
  "domain" "AccessDomain" NOT NULL,
  "attribute" TEXT NOT NULL,
  "comparator" TEXT,
  "value_json" JSONB,
  "unit" TEXT,
  "criticality" "AccessCriticality" NOT NULL DEFAULT 'preference',
  "context_scope" "AccessContextScope" NOT NULL DEFAULT 'always',
  "timing" "AccessTiming" NOT NULL DEFAULT 'permanent',
  "assistance" "AccessAssistanceMode" NOT NULL DEFAULT 'independent',
  "disclosure_scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "user_confirmed" BOOLEAN NOT NULL DEFAULT false,
  "acceptable_adjustment_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "access_requirement_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "access_requirement_records_passport_id_domain_idx"
  ON "access_requirement_records"("passport_id", "domain");
CREATE INDEX "access_requirement_records_ontology_concept_id_idx"
  ON "access_requirement_records"("ontology_concept_id");

CREATE TABLE "access_observation_records" (
  "id" TEXT NOT NULL,
  "feature_key" TEXT NOT NULL,
  "ontology_concept_id" TEXT NOT NULL,
  "value_json" JSONB NOT NULL,
  "unit" TEXT,
  "source_type" TEXT NOT NULL,
  "observed_at" TIMESTAMP(3) NOT NULL,
  "evidence_kinds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "verification_status" "AccessProvenanceStatus" NOT NULL DEFAULT 'unknown',
  "confidence" DOUBLE PRECISION,
  "review_due" TIMESTAMP(3),
  "disputed" BOOLEAN NOT NULL DEFAULT false,
  "place_id" TEXT,
  "entity_type" "AccessEntityType",
  "entity_id" TEXT,
  "evidence_envelope_id" TEXT,
  "observer_user_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "access_observation_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "access_observation_records_place_id_ontology_concept_id_idx"
  ON "access_observation_records"("place_id", "ontology_concept_id");
CREATE INDEX "access_observation_records_entity_type_entity_id_idx"
  ON "access_observation_records"("entity_type", "entity_id");
CREATE INDEX "access_observation_records_ontology_concept_id_observed_at_idx"
  ON "access_observation_records"("ontology_concept_id", "observed_at");

CREATE TABLE "access_capability_records" (
  "id" TEXT NOT NULL,
  "entity_type" "AccessEntityType" NOT NULL,
  "entity_id" TEXT NOT NULL,
  "place_id" TEXT,
  "ontology_concept_id" TEXT NOT NULL,
  "attribute" TEXT NOT NULL,
  "value_json" JSONB NOT NULL,
  "unit" TEXT,
  "availability_json" JSONB,
  "evidence_observation_id" TEXT NOT NULL,
  "status" "AccessProvenanceStatus" NOT NULL DEFAULT 'unknown',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "access_capability_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "access_capability_records_entity_type_entity_id_idx"
  ON "access_capability_records"("entity_type", "entity_id");
CREATE INDEX "access_capability_records_place_id_ontology_concept_id_idx"
  ON "access_capability_records"("place_id", "ontology_concept_id");
CREATE INDEX "access_capability_records_ontology_concept_id_status_idx"
  ON "access_capability_records"("ontology_concept_id", "status");

CREATE TABLE "access_adjustment_records" (
  "id" TEXT NOT NULL,
  "entity_type" "AccessEntityType" NOT NULL,
  "entity_id" TEXT NOT NULL,
  "place_id" TEXT,
  "ontology_concept_id" TEXT,
  "summary" TEXT NOT NULL,
  "description" TEXT,
  "availability_json" JSONB,
  "status" "AccessProvenanceStatus" NOT NULL DEFAULT 'venue_reported',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "access_adjustment_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "access_adjustment_records_entity_type_entity_id_idx"
  ON "access_adjustment_records"("entity_type", "entity_id");
CREATE INDEX "access_adjustment_records_place_id_idx"
  ON "access_adjustment_records"("place_id");

CREATE TABLE "access_journey_records" (
  "id" TEXT NOT NULL,
  "passport_id" TEXT NOT NULL,
  "goal" TEXT NOT NULL,
  "activity" TEXT,
  "overall_state" "AccessCompatibilityState" NOT NULL,
  "limitations" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "evaluated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "access_journey_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "access_journey_records_passport_id_evaluated_at_idx"
  ON "access_journey_records"("passport_id", "evaluated_at");

CREATE TABLE "access_compatibility_records" (
  "id" TEXT NOT NULL,
  "passport_id" TEXT NOT NULL,
  "entity_type" "AccessEntityType" NOT NULL,
  "entity_id" TEXT NOT NULL,
  "journey_id" TEXT,
  "state" "AccessCompatibilityState" NOT NULL,
  "required_met_concept_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "required_unmet_concept_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "required_uncertain_concept_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "preference_met_concept_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "preference_unmet_concept_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "preference_uncertain_concept_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "adjustment_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "evidence_refs" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "limitations" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "participant_decision_required" BOOLEAN NOT NULL DEFAULT true,
  "evaluated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "access_compatibility_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "access_compatibility_records_passport_id_evaluated_at_idx"
  ON "access_compatibility_records"("passport_id", "evaluated_at");
CREATE INDEX "access_compatibility_records_entity_type_entity_id_idx"
  ON "access_compatibility_records"("entity_type", "entity_id");

CREATE TABLE "access_journey_segment_records" (
  "id" TEXT NOT NULL,
  "journey_id" TEXT NOT NULL,
  "kind" "AccessJourneySegmentKind" NOT NULL,
  "sequence" INTEGER NOT NULL,
  "entity_type" "AccessEntityType",
  "entity_id" TEXT,
  "place_id" TEXT,
  "compatibility_state" "AccessCompatibilityState" NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "access_journey_segment_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "access_journey_segment_records_journey_id_sequence_key"
  ON "access_journey_segment_records"("journey_id", "sequence");
CREATE INDEX "access_journey_segment_records_journey_id_idx"
  ON "access_journey_segment_records"("journey_id");

ALTER TABLE "access_passports"
  ADD CONSTRAINT "access_passports_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "access_requirement_records"
  ADD CONSTRAINT "access_requirement_records_passport_id_fkey"
  FOREIGN KEY ("passport_id") REFERENCES "access_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "access_observation_records"
  ADD CONSTRAINT "access_observation_records_place_id_fkey"
  FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "access_capability_records"
  ADD CONSTRAINT "access_capability_records_place_id_fkey"
  FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "access_capability_records"
  ADD CONSTRAINT "access_capability_records_evidence_observation_id_fkey"
  FOREIGN KEY ("evidence_observation_id") REFERENCES "access_observation_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "access_adjustment_records"
  ADD CONSTRAINT "access_adjustment_records_place_id_fkey"
  FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "access_journey_records"
  ADD CONSTRAINT "access_journey_records_passport_id_fkey"
  FOREIGN KEY ("passport_id") REFERENCES "access_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "access_compatibility_records"
  ADD CONSTRAINT "access_compatibility_records_passport_id_fkey"
  FOREIGN KEY ("passport_id") REFERENCES "access_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "access_compatibility_records"
  ADD CONSTRAINT "access_compatibility_records_journey_id_fkey"
  FOREIGN KEY ("journey_id") REFERENCES "access_journey_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "access_journey_segment_records"
  ADD CONSTRAINT "access_journey_segment_records_journey_id_fkey"
  FOREIGN KEY ("journey_id") REFERENCES "access_journey_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "access_journey_segment_records"
  ADD CONSTRAINT "access_journey_segment_records_place_id_fkey"
  FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
