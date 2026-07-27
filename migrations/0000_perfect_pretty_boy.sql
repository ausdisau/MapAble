CREATE TYPE "public"."barrier_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."barrier_type" AS ENUM('lift_out', 'ramp_blocked', 'path_closed', 'door_too_heavy', 'kerb_ramp_missing', 'inaccessible_toilet', 'unsafe_crossing', 'driver_bypass', 'helpful_staff', 'other');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."budget_category" AS ENUM('daily_living', 'transport', 'capacity_building');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'submitted', 'pending', 'processing', 'paid', 'failed');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('open', 'applied', 'interviewing', 'filled', 'closed');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('unverified', 'verified', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transport_status" AS ENUM('requested', 'accepted', 'in_transit', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('participant', 'carer', 'provider', 'admin');--> statement-breakpoint
CREATE TABLE "access_context_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"mobility_aids" jsonb DEFAULT '[]'::jsonb,
	"max_transfer_m" integer DEFAULT 200,
	"stairs_allowed" boolean DEFAULT true,
	"sensory_preferences" jsonb DEFAULT '{}'::jsonb,
	"communication_mode" text DEFAULT 'text',
	"assistance_preferences" jsonb DEFAULT '{}'::jsonb,
	"consent_scopes" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" varchar NOT NULL,
	"worker_id" varchar NOT NULL,
	"service_type" text NOT NULL,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"total_cost" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"tool_calls" jsonb,
	"quick_actions" jsonb,
	"confidence" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text DEFAULT 'New conversation',
	"channel" text DEFAULT 'web',
	"started_at" timestamp DEFAULT now(),
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "community_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_user_id" varchar,
	"location_ref" text NOT NULL,
	"barrier_type" "barrier_type" NOT NULL,
	"severity" "barrier_severity" DEFAULT 'medium' NOT NULL,
	"description" text,
	"photo_url" text,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"moderation_status" "moderation_status" DEFAULT 'unverified' NOT NULL,
	"confidence_weight" numeric(3, 2) DEFAULT '0.5'
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" varchar NOT NULL,
	"provider_id" varchar,
	"period_start" text NOT NULL,
	"period_end" text NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"ndis_claimable" numeric(10, 2),
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"line_items" jsonb,
	"generated_at" timestamp DEFAULT now(),
	"stripe_payment_intent_id" text,
	"stripe_payment_status" text
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"posted_by" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"job_type" text NOT NULL,
	"salary" text,
	"requirements" text[],
	"status" "job_status" DEFAULT 'open' NOT NULL,
	"category" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" varchar NOT NULL,
	"receiver_id" varchar NOT NULL,
	"body" text NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"read" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "participant_budgets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" varchar NOT NULL,
	"category" "budget_category" NOT NULL,
	"total_allocated" numeric(10, 2) NOT NULL,
	"total_used" numeric(10, 2) DEFAULT '0' NOT NULL,
	"period_start" text NOT NULL,
	"period_end" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_tiers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_type" text NOT NULL,
	"tier_name" text NOT NULL,
	"min_usage" numeric(10, 2) NOT NULL,
	"max_usage" numeric(10, 2),
	"rate" numeric(10, 2) NOT NULL,
	"ndis_category" text NOT NULL,
	"ndis_item_code" text,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" varchar NOT NULL,
	"worker_id" varchar NOT NULL,
	"booking_id" varchar,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" varchar,
	"worker_id" varchar NOT NULL,
	"participant_id" varchar NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text,
	"actual_hours" numeric(10, 2),
	"hourly_rate" numeric(10, 2),
	"tier_applied" text,
	"ndis_item_code" text,
	"total_charge" numeric(10, 2),
	"shift_notes" text,
	"status" "session_status" DEFAULT 'in_progress' NOT NULL,
	"date" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transport_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" varchar NOT NULL,
	"worker_id" varchar,
	"pickup_location" text NOT NULL,
	"dropoff_location" text NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"wheelchair_required" boolean DEFAULT false,
	"status" "transport_status" DEFAULT 'requested' NOT NULL,
	"notes" text,
	"estimated_cost" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "transport_trips" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transport_request_id" varchar,
	"worker_id" varchar NOT NULL,
	"participant_id" varchar NOT NULL,
	"distance_km" numeric(10, 2),
	"per_km_rate" numeric(10, 2),
	"tier_applied" text,
	"accessible_vehicle" boolean DEFAULT false,
	"accessible_surcharge" numeric(10, 2) DEFAULT '0',
	"tolls" numeric(10, 2) DEFAULT '0',
	"total_charge" numeric(10, 2),
	"ndis_item_code" text,
	"status" "session_status" DEFAULT 'in_progress' NOT NULL,
	"date" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" DEFAULT 'participant' NOT NULL,
	"location" text,
	"bio" text,
	"avatar" text,
	"is_verified" boolean DEFAULT false,
	"access_needs" text[],
	"languages" text[],
	"skills" text[],
	"ndis_number" text,
	"plan_start_date" text,
	"plan_end_date" text,
	"phone_number" text,
	"stripe_customer_id" text,
	"orb_customer_id" text,
	"orb_subscription_id" text,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "workers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"specializations" text[],
	"hourly_rate" numeric(10, 2),
	"transport_capable" boolean DEFAULT false,
	"transport_type" text,
	"wheelchair_accessible" boolean DEFAULT false,
	"ndis_verified" boolean DEFAULT false,
	"rating" numeric(3, 2) DEFAULT '0',
	"review_count" integer DEFAULT 0,
	"availability" text,
	"photo" text,
	"abn" text,
	"insurance_expiry" text,
	"first_aid_expiry" text,
	"wwcc_number" text,
	"wwcc_expiry" text
);
