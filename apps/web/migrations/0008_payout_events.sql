CREATE TABLE IF NOT EXISTS "payout_events" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "stripe_id" text NOT NULL UNIQUE,
  "kind" text NOT NULL,
  "status" text NOT NULL,
  "user_id" varchar,
  "amount_cents" integer,
  "currency" text,
  "failure_message" text,
  "payload" jsonb,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "payout_events_user_id_idx" ON "payout_events" ("user_id");
