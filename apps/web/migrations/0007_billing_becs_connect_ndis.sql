-- Billing: BECS mandates, NDIS claims, Stripe webhook idempotency, user payment fields
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "auto_debit_enabled" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "auto_debit_grace_days" integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS "default_becs_payment_method_id" text,
  ADD COLUMN IF NOT EXISTS "stripe_account_id" text,
  ADD COLUMN IF NOT EXISTS "stripe_account_status" text,
  ADD COLUMN IF NOT EXISTS "stripe_charges_enabled" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "stripe_payouts_enabled" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "stripe_requirements_due" jsonb;

CREATE TABLE IF NOT EXISTS "becs_mandates" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL,
  "stripe_payment_method_id" text NOT NULL,
  "stripe_mandate_id" text,
  "bsb_last4" text,
  "account_last4" text,
  "bank_name" text,
  "status" text NOT NULL DEFAULT 'pending',
  "mandate_url" text,
  "is_default" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ndis_claims" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoice_id" varchar,
  "service_session_id" varchar,
  "participant_id" varchar NOT NULL,
  "provider_id" varchar,
  "proda_claim_id" text,
  "claim_reference" text NOT NULL,
  "item_code" text NOT NULL,
  "quantity" decimal(10,2) NOT NULL,
  "unit_price" decimal(10,2) NOT NULL,
  "total_amount" decimal(10,2) NOT NULL,
  "service_date" text NOT NULL,
  "status" text NOT NULL DEFAULT 'submitted',
  "status_message" text,
  "rejection_reason" text,
  "request_payload" jsonb,
  "response_payload" jsonb,
  "submitted_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_id" text NOT NULL UNIQUE,
  "event_type" text NOT NULL,
  "received_at" timestamp DEFAULT now()
);
