CREATE TABLE IF NOT EXISTS "chat_handoffs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "session_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "reason" text NOT NULL,
  "status" text DEFAULT 'requested' NOT NULL,
  "channel" text DEFAULT 'web',
  "assigned_to" varchar,
  "resolution_notes" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_chat_handoffs_status" ON "chat_handoffs" ("status");
CREATE INDEX IF NOT EXISTS "idx_chat_handoffs_user" ON "chat_handoffs" ("user_id");
