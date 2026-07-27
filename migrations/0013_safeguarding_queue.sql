-- Add staff-queue lifecycle fields to the safeguarding tables so staff can
-- review, assign, annotate and close incident drafts, complaint drafts, consent
-- records and safeguarding flags from one queue. Consent records previously had
-- no status column; the others already track status. Idempotent.

ALTER TABLE safeguarding_incident_drafts
  ADD COLUMN IF NOT EXISTS assigned_to varchar,
  ADD COLUMN IF NOT EXISTS review_notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

ALTER TABLE safeguarding_complaint_drafts
  ADD COLUMN IF NOT EXISTS assigned_to varchar,
  ADD COLUMN IF NOT EXISTS review_notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

ALTER TABLE safeguarding_consent_records
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS assigned_to varchar,
  ADD COLUMN IF NOT EXISTS review_notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

ALTER TABLE safeguarding_concern_flags
  ADD COLUMN IF NOT EXISTS assigned_to varchar,
  ADD COLUMN IF NOT EXISTS review_notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();
