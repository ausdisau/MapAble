CREATE TYPE "public"."shift_status" AS ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "ndis_plan_cache" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" varchar NOT NULL,
	"plan_data" jsonb,
	"goals" jsonb,
	"fetched_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp (6) NOT NULL,
	"id" uuid,
	"userId" uuid,
	"expiresAt" timestamp with time zone,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone,
	"activeOrganizationId" text,
	"token" text,
	"ipAddress" text,
	"userAgent" text,
	"impersonatedBy" text
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" varchar NOT NULL,
	"worker_id" varchar NOT NULL,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"ndis_goal" text,
	"ndis_category" text,
	"status" "shift_status" DEFAULT 'scheduled' NOT NULL,
	"recurrence_rule" text,
	"notes" text,
	"service_session_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_email_inboxes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"inbox_id" varchar NOT NULL,
	"email" varchar NOT NULL,
	"display_name" varchar,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_email_inboxes_inbox_id_unique" UNIQUE("inbox_id")
);
--> statement-breakpoint
CREATE TABLE "worker_availability" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_id" varchar NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_recurring" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "worker_blockouts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_id" varchar NOT NULL,
	"date" text NOT NULL,
	"reason" text
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auth0_sub" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "provider_abn" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "provider_business_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "provider_registration_groups" text[];--> statement-breakpoint
ALTER TABLE "workers" ADD COLUMN "screening_number" text;--> statement-breakpoint
ALTER TABLE "workers" ADD COLUMN "screening_clearance_status" text;--> statement-breakpoint
ALTER TABLE "workers" ADD COLUMN "screening_expiry" text;