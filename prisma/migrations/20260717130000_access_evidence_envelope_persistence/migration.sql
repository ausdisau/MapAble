-- Persistent Access Evidence Envelope + Human Change Review (Living Access Evidence moat)
-- Does not create a second AccessPlace source of truth.

CREATE TABLE "access_evidence_envelope_records" (
    "id" TEXT NOT NULL,
    "envelope_id" TEXT NOT NULL,
    "place_id" TEXT,
    "subject_canonical_ref" TEXT NOT NULL,
    "subject_node_id" TEXT,
    "feature_key" TEXT,
    "evidence_classes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "envelope_json" JSONB NOT NULL,
    "conflict_state" TEXT NOT NULL DEFAULT 'none',
    "verification_status" TEXT NOT NULL DEFAULT 'unverified',
    "observed_at" TIMESTAMP(3),
    "effective_from" TIMESTAMP(3),
    "effective_to" TIMESTAMP(3),
    "freshness_policy_key" TEXT,
    "expires_at" TIMESTAMP(3),
    "precision_note" TEXT,
    "confidence_basis" TEXT,
    "contributor_mode" TEXT NOT NULL DEFAULT 'private',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "superseded_by" TEXT,

    CONSTRAINT "access_evidence_envelope_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "access_change_review_records" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "place_id" TEXT,
    "evidence_envelope_id" TEXT,
    "subject_canonical_ref" TEXT NOT NULL,
    "subject_node_id" TEXT NOT NULL,
    "ontology_concept_id" TEXT NOT NULL,
    "candidate_json" JSONB NOT NULL,
    "outcome" TEXT NOT NULL,
    "old_state_summary" TEXT NOT NULL,
    "new_candidate_summary" TEXT NOT NULL,
    "decision" TEXT NOT NULL DEFAULT 'pending',
    "reviewer_id" TEXT,
    "decided_at" TIMESTAMP(3),
    "notes_json" JSONB NOT NULL DEFAULT '[]',
    "auto_overwrite_blocked" BOOLEAN NOT NULL DEFAULT true,
    "expiry_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_change_review_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "access_evidence_envelope_records_envelope_id_key" ON "access_evidence_envelope_records"("envelope_id");
CREATE INDEX "access_evidence_envelope_records_place_id_created_at_idx" ON "access_evidence_envelope_records"("place_id", "created_at");
CREATE INDEX "access_evidence_envelope_records_subject_canonical_ref_idx" ON "access_evidence_envelope_records"("subject_canonical_ref");
CREATE INDEX "access_evidence_envelope_records_subject_node_id_idx" ON "access_evidence_envelope_records"("subject_node_id");
CREATE INDEX "access_evidence_envelope_records_expires_at_idx" ON "access_evidence_envelope_records"("expires_at");

CREATE UNIQUE INDEX "access_change_review_records_review_id_key" ON "access_change_review_records"("review_id");
CREATE INDEX "access_change_review_records_place_id_created_at_idx" ON "access_change_review_records"("place_id", "created_at");
CREATE INDEX "access_change_review_records_subject_node_id_decision_idx" ON "access_change_review_records"("subject_node_id", "decision");
CREATE INDEX "access_change_review_records_decision_created_at_idx" ON "access_change_review_records"("decision", "created_at");

ALTER TABLE "access_evidence_envelope_records" ADD CONSTRAINT "access_evidence_envelope_records_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "access_change_review_records" ADD CONSTRAINT "access_change_review_records_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "access_change_review_records" ADD CONSTRAINT "access_change_review_records_evidence_envelope_id_fkey" FOREIGN KEY ("evidence_envelope_id") REFERENCES "access_evidence_envelope_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
