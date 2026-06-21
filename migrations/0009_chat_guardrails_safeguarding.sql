CREATE TABLE IF NOT EXISTS "chat_guardrail_audit_logs" (
  "id" serial PRIMARY KEY,
  "session_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "input" text NOT NULL,
  "output" text,
  "tool_calls" jsonb DEFAULT '[]'::jsonb,
  "classifier_verdicts" jsonb DEFAULT '[]'::jsonb,
  "guardrail_actions" jsonb DEFAULT '[]'::jsonb,
  "policy_refs" jsonb DEFAULT '[]'::jsonb,
  "policy_pack_version" text NOT NULL,
  "flagged_for_review" boolean DEFAULT false NOT NULL,
  "retention_until" timestamp,
  "created_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "safeguarding_incident_drafts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "session_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "incident_type" text NOT NULL,
  "immediate_actions" text NOT NULL,
  "reportable" boolean DEFAULT false NOT NULL,
  "lodged_24h" boolean DEFAULT false NOT NULL,
  "lodged_5day" boolean DEFAULT false NOT NULL,
  "investigation_summary" text,
  "corrective_actions" text,
  "status" text DEFAULT 'draft' NOT NULL,
  "created_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "safeguarding_complaint_drafts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "session_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "issue" text NOT NULL,
  "raised_by" text DEFAULT 'participant' NOT NULL,
  "acknowledged_at" timestamp,
  "outcome" text,
  "appeal" boolean DEFAULT false NOT NULL,
  "improvements_logged" text,
  "status" text DEFAULT 'draft' NOT NULL,
  "created_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "safeguarding_consent_records" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "session_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "subject" text NOT NULL,
  "scope" text NOT NULL,
  "granted" boolean NOT NULL,
  "evidence" text,
  "created_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "safeguarding_concern_flags" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "session_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "concern_type" text NOT NULL,
  "summary" text NOT NULL,
  "severity" text DEFAULT 'medium' NOT NULL,
  "status" text DEFAULT 'needs_review' NOT NULL,
  "created_at" timestamp DEFAULT now()
);