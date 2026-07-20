-- MapAble Access Phase 1 — AccessPlace domain (repaired for migrate-from-zero).
-- Historical repair (migration-trust): this folder originally contained a near-full
-- schema dump that re-created User and other objects from earlier migrations, causing
-- P3018/42P07 on empty-DB migrate deploy. Body reduced to Access* enums, access_*
-- tables, indexes, and FKs. See docs/remediation/MIGRATE_FROM_ZERO_REPAIR.md.
-- Allowlisted in scripts/ci/allowed-migration-repairs.json.

CREATE TYPE "AccessPlaceCategory" AS ENUM ('cafe_restaurant', 'bar_pub', 'shop', 'shopping_centre', 'park', 'beach', 'library', 'museum_gallery', 'theatre_cinema', 'sports_venue', 'community_centre', 'health_service', 'education', 'transport_station', 'public_toilet', 'accommodation', 'tourism_attraction', 'government_service', 'other');


-- CreateEnum
CREATE TYPE "AccessPlaceStatus" AS ENUM ('draft', 'pending_moderation', 'published', 'hidden', 'archived');


-- CreateEnum
CREATE TYPE "AccessPlaceSourceType" AS ENUM ('user_suggested', 'imported', 'venue_claimed', 'mapable_verified', 'manual_admin');


-- CreateEnum
CREATE TYPE "AccessPlaceFeatureType" AS ENUM ('step_free_entry', 'accessible_parking', 'accessible_toilet', 'changing_places', 'lift_access', 'ramp_access', 'wide_doorways', 'wide_paths', 'hearing_loop', 'braille_tactile_signage', 'quiet_space', 'low_sensory_environment', 'assistance_animals_welcome', 'accessible_dropoff', 'public_transport_nearby');


-- CreateEnum
CREATE TYPE "AccessConfidenceLevel" AS ENUM ('unknown', 'user_reported', 'multiple_user_reports', 'venue_claimed', 'mapable_verified', 'mapable_accredited');


-- CreateEnum
CREATE TYPE "AccessReviewStatus" AS ENUM ('draft', 'pending', 'published', 'hidden', 'rejected');


-- CreateEnum
CREATE TYPE "AccessReviewVisibility" AS ENUM ('public', 'mapable_only');


-- CreateEnum
CREATE TYPE "AccessDisplayNameMode" AS ENUM ('named', 'first_name', 'anonymous_public');


-- CreateEnum
CREATE TYPE "AccessRatingValue" AS ENUM ('not_applicable', 'unknown', 'poor', 'basic', 'good', 'excellent');


-- CreateEnum
CREATE TYPE "AccessRatingCategory" AS ENUM ('accessible_parking', 'public_transport_dropoff', 'path_to_entrance', 'main_entrance', 'doorway', 'internal_movement', 'ramps_lifts', 'service_counter', 'seating_furniture', 'accessible_toilet', 'ambulant_toilet', 'signage', 'hearing_access', 'lighting_acoustics', 'online_information', 'staff_training', 'service_access');


-- CreateEnum
CREATE TYPE "AccessImportSourceType" AS ENUM ('uploaded_kml', 'kml_network_link', 'google_my_maps_kml', 'geojson_upload', 'csv', 'manual_admin_entry');


-- CreateEnum
CREATE TYPE "AccessImportJobStatus" AS ENUM ('pending', 'parsing', 'preview_ready', 'committing', 'completed', 'failed', 'cancelled');


-- CreateEnum
CREATE TYPE "AccessImportItemStatus" AS ENUM ('pending', 'accepted', 'skipped', 'conflict');


-- CreateEnum
CREATE TYPE "AccessAccreditationLevel" AS ENUM ('fail', 'bronze', 'silver', 'gold', 'not_applicable');


-- CreateEnum
CREATE TYPE "AccessAccreditationAssessmentStatus" AS ENUM ('draft', 'assessor_review', 'evidence_required', 'scored', 'published', 'expired', 'withdrawn');


-- CreateEnum
CREATE TYPE "AccessAccreditationTier" AS ENUM ('not_accredited', 'bronze', 'silver', 'gold');


-- CreateEnum
CREATE TYPE "AccessVenueClaimStatus" AS ENUM ('submitted', 'needs_evidence', 'approved', 'rejected', 'revoked');


-- CreateEnum
CREATE TYPE "AccessModerationStatus" AS ENUM ('pending', 'approved', 'rejected', 'hidden', 'needs_changes', 'escalated');


-- CreateEnum
CREATE TYPE "AccessContentReportReason" AS ENUM ('inaccurate_access_information', 'abusive_or_harassing', 'private_information', 'defamatory_or_unverified_claim', 'unsafe_advice', 'spam', 'duplicate_place', 'closed_or_moved_place', 'other');


-- CreateTable
CREATE TABLE "access_places" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "AccessPlaceCategory" NOT NULL DEFAULT 'other',
    "description" TEXT,
    "address_text" TEXT,
    "suburb" TEXT,
    "state_or_region" TEXT,
    "country" TEXT NOT NULL DEFAULT 'AU',
    "status" "AccessPlaceStatus" NOT NULL DEFAULT 'draft',
    "source_type" "AccessPlaceSourceType" NOT NULL DEFAULT 'user_suggested',
    "source_reference" TEXT,
    "confidence" "AccessConfidenceLevel" NOT NULL DEFAULT 'unknown',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_places_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_place_locations" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "geohash" TEXT,

    CONSTRAINT "access_place_locations_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_place_features" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "type" "AccessPlaceFeatureType" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "access_place_features_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_place_sources" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "source_type" "AccessImportSourceType" NOT NULL,
    "source_url" TEXT,
    "external_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_place_sources_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_place_claims" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "AccessVenueClaimStatus" NOT NULL DEFAULT 'submitted',
    "evidence_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_place_claims_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_place_reports" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "reporter_id" TEXT,
    "reason" "AccessContentReportReason" NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_place_reports_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_place_events" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_place_events_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_reviews" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "reviewer_profile_id" TEXT NOT NULL,
    "display_name_mode" "AccessDisplayNameMode" NOT NULL DEFAULT 'anonymous_public',
    "visit_date" TIMESTAMP(3),
    "review_body" TEXT NOT NULL,
    "mobility_context" TEXT,
    "status" "AccessReviewStatus" NOT NULL DEFAULT 'draft',
    "visibility" "AccessReviewVisibility" NOT NULL DEFAULT 'public',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_reviews_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_review_ratings" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "category" "AccessRatingCategory" NOT NULL,
    "value" "AccessRatingValue" NOT NULL,

    CONSTRAINT "access_review_ratings_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_review_photos" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "alt_text" TEXT,
    "mime_type" TEXT,
    "status" "AccessModerationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_review_photos_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_review_reports" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "reporter_id" TEXT,
    "reason" "AccessContentReportReason" NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_review_reports_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_review_events" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_review_events_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_rating_summaries" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "category" "AccessRatingCategory" NOT NULL,
    "avg_score" DOUBLE PRECISION,
    "sample_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_rating_summaries_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_import_jobs" (
    "id" TEXT NOT NULL,
    "status" "AccessImportJobStatus" NOT NULL DEFAULT 'pending',
    "source_type" "AccessImportSourceType" NOT NULL,
    "source_url" TEXT,
    "file_name" TEXT,
    "created_by" TEXT NOT NULL,
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_import_jobs_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_import_sources" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "url" TEXT,
    "raw_meta" JSONB,

    CONSTRAINT "access_import_sources_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_import_items" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "status" "AccessImportItemStatus" NOT NULL DEFAULT 'pending',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "category" TEXT,
    "external_ref" TEXT,
    "matched_place_id" TEXT,
    "raw_data" JSONB,

    CONSTRAINT "access_import_items_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_import_conflicts" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "import_item_id" TEXT NOT NULL,
    "existing_place_id" TEXT,
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_import_conflicts_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_accreditation_criteria" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "access_accreditation_criteria_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_accreditation_assessments" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "assessor_id" TEXT NOT NULL,
    "status" "AccessAccreditationAssessmentStatus" NOT NULL DEFAULT 'draft',
    "total_score" DOUBLE PRECISION,
    "tier" "AccessAccreditationTier",
    "published_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_accreditation_assessments_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_accreditation_scores" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "criterion_code" TEXT NOT NULL,
    "level" "AccessAccreditationLevel" NOT NULL,
    "weighted_score" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "access_accreditation_scores_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_accreditation_evidence" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_accreditation_evidence_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_accreditation_events" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_accreditation_events_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_venue_claims" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "AccessVenueClaimStatus" NOT NULL DEFAULT 'submitted',
    "business_name" TEXT,
    "evidence_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_venue_claims_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_venue_profiles" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "access_info" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_venue_profiles_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_venue_review_responses" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "venue_user_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "AccessModerationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_venue_review_responses_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_accreditation_requests" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_accreditation_requests_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_venue_evidence" (
    "id" TEXT NOT NULL,
    "claim_id" TEXT,
    "place_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_venue_evidence_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_moderation_queue" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "review_id" TEXT,
    "status" "AccessModerationStatus" NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "flag_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_moderation_queue_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_moderation_decisions" (
    "id" TEXT NOT NULL,
    "queue_id" TEXT NOT NULL,
    "moderator_id" TEXT NOT NULL,
    "status" "AccessModerationStatus" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_moderation_decisions_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_content_reports" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "reporter_id" TEXT,
    "reason" "AccessContentReportReason" NOT NULL,
    "details" TEXT,
    "status" "AccessModerationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_content_reports_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "access_trust_events" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_trust_events_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE INDEX "access_places_status_idx" ON "access_places"("status");


-- CreateIndex
CREATE INDEX "access_places_suburb_state_or_region_idx" ON "access_places"("suburb", "state_or_region");


-- CreateIndex
CREATE UNIQUE INDEX "access_place_locations_place_id_key" ON "access_place_locations"("place_id");


-- CreateIndex
CREATE UNIQUE INDEX "access_place_features_place_id_type_key" ON "access_place_features"("place_id", "type");


-- CreateIndex
CREATE INDEX "access_reviews_place_id_status_idx" ON "access_reviews"("place_id", "status");


-- CreateIndex
CREATE UNIQUE INDEX "access_review_ratings_review_id_category_key" ON "access_review_ratings"("review_id", "category");


-- CreateIndex
CREATE UNIQUE INDEX "access_rating_summaries_place_id_category_key" ON "access_rating_summaries"("place_id", "category");


-- CreateIndex
CREATE UNIQUE INDEX "access_accreditation_criteria_code_key" ON "access_accreditation_criteria"("code");


-- CreateIndex
CREATE INDEX "access_accreditation_assessments_place_id_status_idx" ON "access_accreditation_assessments"("place_id", "status");


-- CreateIndex
CREATE UNIQUE INDEX "access_accreditation_scores_assessment_id_criterion_code_key" ON "access_accreditation_scores"("assessment_id", "criterion_code");


-- CreateIndex
CREATE UNIQUE INDEX "access_venue_profiles_place_id_key" ON "access_venue_profiles"("place_id");


-- CreateIndex
CREATE INDEX "access_moderation_queue_status_created_at_idx" ON "access_moderation_queue"("status", "created_at");

ALTER TABLE "access_places" ADD CONSTRAINT "access_places_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "access_place_locations" ADD CONSTRAINT "access_place_locations_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "access_place_features" ADD CONSTRAINT "access_place_features_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "access_place_sources" ADD CONSTRAINT "access_place_sources_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "access_place_claims" ADD CONSTRAINT "access_place_claims_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "access_place_claims" ADD CONSTRAINT "access_place_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "access_place_reports" ADD CONSTRAINT "access_place_reports_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "access_place_reports" ADD CONSTRAINT "access_place_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "access_place_events" ADD CONSTRAINT "access_place_events_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "access_reviews" ADD CONSTRAINT "access_reviews_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "access_reviews" ADD CONSTRAINT "access_reviews_reviewer_profile_id_fkey" FOREIGN KEY ("reviewer_profile_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "access_review_ratings" ADD CONSTRAINT "access_review_ratings_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "access_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "access_review_photos" ADD CONSTRAINT "access_review_photos_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "access_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
