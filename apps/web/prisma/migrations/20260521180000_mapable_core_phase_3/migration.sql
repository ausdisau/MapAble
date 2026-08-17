-- MapAble Core Phase 3 — bootstrap schema for empty-database migrate-from-zero.
-- Allowlisted historical repair (see scripts/ci/allowed-migration-repairs.json).
--
-- Creates core domain objects later migrations assume exist.
-- Physical table names follow Prisma @@map (e.g. CareRequest → care_requests).
-- Enum labels omit values later migrations ADD, except labels used in the same
-- migration transaction (PostgreSQL 55P04 safe-enum rule).
-- Enriches phase_1 stubs; includes care_bookings / care_service_* pre-ALTER shapes.
-- Skips AccessPlace (access_phase_1) and Incident* (care_mvp).


-- Enums (only those referenced by bootstrap tables)
CREATE TYPE "AdjustmentRequestStatus" AS ENUM ('not_requested', 'requested', 'under_review', 'agreed', 'declined_with_reason', 'withdrawn');
CREATE TYPE "AiMatchRunStatus" AS ENUM ('draft', 'generated', 'fairness_review_required', 'reviewed', 'accepted', 'rejected', 'expired');
CREATE TYPE "AlgorithmRegisterStatus" AS ENUM ('draft', 'published', 'deprecated');
CREATE TYPE "ApiCertificationStatus" AS ENUM ('draft', 'submitted', 'under_review', 'certified', 'rejected');
CREATE TYPE "ApiScope" AS ENUM ('places_read', 'providers_read', 'bookings_read', 'bookings_write', 'invoices_read', 'support_tickets_write', 'webhooks_receive');
CREATE TYPE "AttestationStatus" AS ENUM ('recorded', 'superseded', 'revoked', 'disputed');
CREATE TYPE "AttestationType" AS ENUM ('participant_confirmed_booking', 'participant_approved_timesheet', 'provider_accepted_service_agreement', 'worker_accepted_shift', 'driver_confirmed_pickup', 'driver_confirmed_dropoff', 'admin_verified_provider', 'contract_passed', 'invoice_preflight_passed', 'incident_triage_completed');
CREATE TYPE "BillingAccountRole" AS ENUM ('participant', 'provider', 'employer', 'admin', 'support_worker', 'transport_operator');
CREATE TYPE "BillingFundingSourceType" AS ENUM ('ndis_plan_managed', 'ndis_self_managed', 'private_card', 'organisation_invoice', 'grant', 'other');
CREATE TYPE "BillingInvoiceStatus" AS ENUM ('draft', 'approved', 'issued', 'paid', 'void', 'pending_payment', 'failed', 'refunded', 'cancelled', 'exported');
CREATE TYPE "BillingPaymentMethod" AS ENUM ('stripe_checkout', 'stripe_connect', 'external_plan_manager', 'xero_export', 'manual');
CREATE TYPE "BillingPaymentSplitRecipient" AS ENUM ('provider', 'worker', 'transport_operator', 'mapable_platform');
CREATE TYPE "BillingPaymentSplitStatus" AS ENUM ('pending', 'pending_service', 'transferred', 'failed', 'reversed', 'canceled');
CREATE TYPE "BillingPaymentStatus" AS ENUM ('requires_payment', 'processing', 'succeeded', 'failed', 'refunded', 'disputed');
CREATE TYPE "BillingPreflightStatus" AS ENUM ('passed', 'failed');
CREATE TYPE "BillingServiceType" AS ENUM ('care', 'transport', 'jobs', 'marketplace', 'subscription', 'other');
CREATE TYPE "BillingSubscriptionPlanCode" AS ENUM ('provider_pro', 'employer_pro', 'marketplace_featured', 'other');
CREATE TYPE "BillingSubscriptionStatus" AS ENUM ('incomplete', 'active', 'past_due', 'canceled', 'unpaid', 'trialing');
CREATE TYPE "BookingTimelineEventType" AS ENUM ('booking_created', 'booking_submitted', 'booking_assigned', 'provider_accepted', 'provider_declined', 'booking_confirmed', 'booking_completed', 'invoice_drafted', 'support_ticket_created', 'message_sent', 'trip_status_updated', 'booking_at_risk');
CREATE TYPE "CalendarEventType" AS ENUM ('care_request', 'care_shift', 'transport_booking', 'job_application', 'job_interview', 'support_ticket_followup', 'admin_task');
CREATE TYPE "CalendarVisibility" AS ENUM ('participant_private', 'organisation', 'employer', 'admin_only');
CREATE TYPE "CareBookingStatus" AS ENUM ('pending_provider', 'accepted', 'declined', 'worker_assigned', 'in_progress', 'completed', 'cancelled', 'disputed');
CREATE TYPE "CareRequestStatus" AS ENUM ('draft', 'submitted', 'awaiting_admin_review', 'awaiting_provider_response', 'matched', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed');
CREATE TYPE "CareRequestType" AS ENUM ('personal_care', 'domestic_assistance', 'community_access', 'appointment_support', 'employment_support', 'meal_preparation', 'therapy_assistance', 'skill_building', 'overnight_support', 'other');
CREATE TYPE "CareServiceLogStatus" AS ENUM ('draft', 'submitted', 'confirmed', 'disputed');
CREATE TYPE "CareShiftStatus" AS ENUM ('scheduled', 'worker_assigned', 'confirmed', 'worker_en_route', 'checked_in', 'in_progress', 'checked_out', 'awaiting_participant_approval', 'approved', 'completed', 'cancelled', 'disputed');
CREATE TYPE "ComplianceControlStatus" AS ENUM ('not_started', 'implemented', 'needs_review', 'exception_approved', 'retired');
CREATE TYPE "ContractRunResult" AS ENUM ('passed', 'blocked', 'review_required', 'not_applicable');
CREATE TYPE "ConversationType" AS ENUM ('participant_provider', 'participant_support_coordinator', 'participant_admin', 'booking_thread', 'support_ticket_thread', 'organisation_admin');
CREATE TYPE "CoordinatorRelationshipStatus" AS ENUM ('pending', 'active', 'suspended', 'ended');
CREATE TYPE "CoordinatorTaskType" AS ENUM ('review_booking', 'help_create_booking', 'review_invoice', 'upload_document', 'review_service_agreement', 'follow_up_support_ticket', 'review_incident', 'funding_source_review');
CREATE TYPE "DataVaultRequestStatus" AS ENUM ('pending', 'processing', 'completed', 'rejected');
CREATE TYPE "DataVaultRequestType" AS ENUM ('export', 'portability', 'deletion_review');
CREATE TYPE "DeveloperAppStatus" AS ENUM ('draft', 'pending_review', 'approved', 'suspended', 'revoked');
CREATE TYPE "DispatchQueuePriority" AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE "DispatchQueueType" AS ENUM ('care_shift', 'transport_booking', 'incident', 'general');
CREATE TYPE "DocumentCategory" AS ENUM ('participant_identity', 'participant_plan', 'service_agreement', 'provider_insurance', 'provider_registration', 'worker_screening', 'booking_attachment', 'invoice_attachment', 'support_ticket_attachment', 'accessibility_evidence', 'other');
CREATE TYPE "DocumentScanStatus" AS ENUM ('not_configured', 'pending', 'passed', 'failed');
CREATE TYPE "DocumentVisibility" AS ENUM ('private_to_participant', 'shared_with_provider', 'shared_with_plan_manager', 'admin_only', 'organisation_private');
CREATE TYPE "EmploymentType" AS ENUM ('full_time', 'part_time', 'casual', 'contract', 'volunteer', 'work_experience', 'supported_employment');
CREATE TYPE "FairnessCheckStatus" AS ENUM ('passed', 'warning', 'failed', 'review_required');
CREATE TYPE "FundingSourceStatus" AS ENUM ('active', 'inactive', 'pending_review', 'expired');
CREATE TYPE "FundingSourceType" AS ENUM ('ndis_self_managed', 'ndis_plan_managed', 'ndis_agency_managed', 'private_pay', 'aged_care', 'employer', 'other');
CREATE TYPE "InterviewMode" AS ENUM ('phone', 'video', 'in_person', 'written', 'other');
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'preflight_required', 'preflight_failed', 'approved_for_invoicing', 'xero_sync_pending', 'xero_synced', 'stripe_payment_pending', 'partially_paid', 'paid', 'voided');
CREATE TYPE "JobApplicationStatus" AS ENUM ('draft', 'submitted', 'under_review', 'interview_requested', 'successful', 'unsuccessful', 'withdrawn');
CREATE TYPE "JobStatus" AS ENUM ('draft', 'published', 'closed', 'archived');
CREATE TYPE "LaunchReadinessStatus" AS ENUM ('not_started', 'in_progress', 'blocked', 'ready', 'waived');
CREATE TYPE "MatchCandidateStatus" AS ENUM ('generated', 'recommended', 'shortlisted', 'selected', 'rejected', 'expired');
CREATE TYPE "MatchFactorType" AS ENUM ('availability', 'location', 'service_type', 'accessibility_requirement', 'communication_preference', 'credential_status', 'prior_relationship', 'participant_preference', 'vehicle_suitability', 'provider_verification', 'price_or_funding_fit', 'manual_admin_override');
CREATE TYPE "MatchRunStatus" AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE "MatchType" AS ENUM ('care_worker', 'care_provider', 'transport_vehicle', 'transport_driver', 'transport_operator', 'job_support');
CREATE TYPE "NdiaIntegrationMode" AS ENUM ('not_configured', 'manual_export', 'plan_manager_export', 'dry_run', 'approved_api_placeholder');
CREATE TYPE "NdiaProviderClaimStatus" AS ENUM ('draft', 'validated', 'dry_run_passed', 'submitted', 'accepted', 'rejected', 'paid', 'failed');
CREATE TYPE "NdisPriceChangeType" AS ENUM ('new_item', 'updated_price', 'retired_item', 'changed_unit', 'changed_category', 'changed_conditions');
CREATE TYPE "NdisPriceImportStatus" AS ENUM ('uploaded', 'parsed', 'validated', 'review_required', 'approved', 'applied', 'failed', 'cancelled');
CREATE TYPE "NdisRuleWarningSeverity" AS ENUM ('info', 'warning', 'error');
CREATE TYPE "OrchestrationEventType" AS ENUM ('care_transport_link_created', 'interview_transport_draft_created', 'invoice_from_care_shift', 'care_request_submitted');
CREATE TYPE "PlanManagerInvoiceReviewStatus" AS ENUM ('pending', 'in_review', 'query_raised', 'approved_for_payment', 'rejected', 'paid_externally', 'closed');
CREATE TYPE "PublicApiVersionStatus" AS ENUM ('draft', 'stable', 'deprecated', 'sunset');
CREATE TYPE "PublicBetaFeedbackCategory" AS ENUM ('accessibility', 'usability', 'booking', 'transport', 'billing', 'other');
CREATE TYPE "ReconciliationMatchStatus" AS ENUM ('unmatched', 'partial', 'matched', 'reviewed', 'exception');
CREATE TYPE "ReportingMetricCategory" AS ENUM ('participants', 'care', 'transport', 'jobs', 'billing', 'incidents', 'accessibility', 'provider_quality', 'social_impact');
CREATE TYPE "RouteConstraintType" AS ENUM ('wheelchair_accessible_vehicle_required', 'extra_boarding_time', 'assistance_animal', 'max_time_in_vehicle', 'appointment_deadline', 'return_trip_required', 'driver_assistance_required', 'participant_preference');
CREATE TYPE "RoutePlanStatus" AS ENUM ('draft', 'generated', 'review_required', 'selected', 'rejected', 'expired');
CREATE TYPE "SecurityFrameworkType" AS ENUM ('soc2', 'iso27001', 'privacy_act', 'ndis_quality_safeguards', 'internal');
CREATE TYPE "ServiceAgreementStatus" AS ENUM ('draft', 'sent_for_review', 'participant_review', 'signed', 'active', 'expired', 'cancelled');
CREATE TYPE "ServiceAgreementType" AS ENUM ('care', 'transport', 'care_transport', 'jobs_support', 'general_platform');
CREATE TYPE "SmartContractStatus" AS ENUM ('draft', 'active', 'paused', 'retired');
CREATE TYPE "SmartContractType" AS ENUM ('consent_gate', 'service_agreement_gate', 'booking_confirmation_gate', 'provider_verification_gate', 'worker_assignment_gate', 'transport_assignment_gate', 'invoice_preflight_gate', 'payment_release_gate', 'incident_escalation_gate');
CREATE TYPE "StripePaymentPurpose" AS ENUM ('participant_private_pay', 'participant_copay', 'provider_subscription', 'employer_subscription', 'other');
CREATE TYPE "SupportTicketCategory" AS ENUM ('booking_help', 'transport_issue', 'care_provider_issue', 'accessibility_issue', 'billing_question', 'profile_help', 'technical_issue', 'complaint', 'safeguarding_concern', 'other');
CREATE TYPE "SupportTicketPriority" AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE "SupportTicketStatus" AS ENUM ('open', 'triage', 'waiting_on_user', 'waiting_on_provider', 'escalated', 'resolved', 'closed');
CREATE TYPE "TimesheetStatus" AS ENUM ('draft', 'submitted', 'participant_review', 'approved', 'rejected', 'disputed', 'invoice_ready');
CREATE TYPE "TransportBookingStatus" AS ENUM ('draft', 'requested', 'awaiting_operator_response', 'operator_accepted', 'driver_assigned', 'vehicle_assigned', 'confirmed', 'driver_en_route', 'arrived_for_pickup', 'participant_on_board', 'in_transit', 'arrived_at_destination', 'completed', 'cancelled', 'disputed');
CREATE TYPE "TransportBookingType" AS ENUM ('one_way', 'return_trip', 'multi_stop_placeholder');
CREATE TYPE "TransportNetworkRolloutStatus" AS ENUM ('planned', 'pilot', 'live', 'paused');
CREATE TYPE "TripTrackingEventType" AS ENUM ('status_update', 'location_update', 'eta_update', 'delay_reported', 'pickup_confirmed', 'dropoff_confirmed', 'safety_check', 'manual_admin_update');
CREATE TYPE "TripTrackingStatus" AS ENUM ('not_started', 'driver_en_route', 'arrived_for_pickup', 'participant_on_board', 'in_transit', 'arrived_at_destination', 'completed', 'cancelled');
CREATE TYPE "VehicleType" AS ENUM ('standard_car', 'wheelchair_accessible_taxi', 'accessible_van', 'community_transport_bus', 'other');
CREATE TYPE "VerificationCaseStatus" AS ENUM ('draft', 'submitted', 'under_review', 'more_information_required', 'approved', 'approved_with_conditions', 'rejected', 'suspended', 'expired');
CREATE TYPE "VerificationCheckType" AS ENUM ('abn', 'insurance', 'ndis_registration_claim', 'worker_screening_policy', 'incident_policy', 'complaints_policy', 'privacy_policy', 'service_agreement_template', 'vehicle_registration', 'driver_licence', 'accessibility_training', 'manual_reference_check');
CREATE TYPE "WorkerCredentialStatus" AS ENUM ('not_provided', 'pending_review', 'verified', 'expired', 'rejected');

-- Enrich stub tables from earlier migrations
ALTER TABLE "WorkerProfile"
ADD COLUMN "organisationId" TEXT NOT NULL,
ADD COLUMN "displayName" TEXT NOT NULL,
ADD COLUMN "profileSummary" TEXT,
ADD COLUMN "serviceTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "serviceRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "communicationCapabilities" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "qualificationsSummary" TEXT,
ADD COLUMN "workerScreeningStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'not_provided',
ADD COLUMN "wwccStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'not_provided',
ADD COLUMN "firstAidStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'not_provided',
ADD COLUMN "insuranceStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'not_provided',
ADD COLUMN "verificationStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'pending_review',
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL;
ALTER TABLE "Vehicle"
ADD COLUMN "displayName" TEXT NOT NULL,
ADD COLUMN "vehicleType" "VehicleType" NOT NULL DEFAULT 'standard_car',
ADD COLUMN "registrationNumber" TEXT,
ADD COLUMN "rampAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "liftAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "wheelchairSpaces" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "seatedCapacity" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN "canCarryPowerWheelchair" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "assistanceAnimalFriendly" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "airConditioning" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notes" TEXT,
ADD COLUMN "verificationStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'pending_review',
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL;
ALTER TABLE "DriverProfile"
ADD COLUMN "organisationId" TEXT NOT NULL,
ADD COLUMN "displayName" TEXT NOT NULL,
ADD COLUMN "phone" TEXT,
ADD COLUMN "serviceRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "licenceStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'not_provided',
ADD COLUMN "accessibilityTrainingStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'not_provided',
ADD COLUMN "workerScreeningStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'not_provided',
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "verificationStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'pending_review',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL;

-- Tables
CREATE TABLE "provider_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "legacyProviderId" TEXT,
    "suburb" TEXT,
    "state" TEXT,
    "postcode" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isSearchVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_profiles_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "provider_services" (
    "id" TEXT NOT NULL,
    "providerProfileId" TEXT NOT NULL,
    "serviceCategoryId" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "provider_services_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "service_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "accessibility_features" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accessibility_features_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "searchable_locations" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "suburb" TEXT,
    "state" TEXT,
    "postcode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'AU',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "searchable_locations_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "popular_searches" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT 'all',
    "weight" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "popular_searches_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "search_languages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_languages_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL,
    "title" TEXT NOT NULL,
    "participantId" TEXT,
    "bookingId" TEXT,
    "supportTicketId" TEXT,
    "organisationId" TEXT,
    "createdById" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "plainLanguageSummary" TEXT,
    "attachmentDocumentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MessageReadReceipt" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReadReceipt_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "SupportTicketCategory" NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'open',
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'normal',
    "participantId" TEXT,
    "organisationId" TEXT,
    "bookingId" TEXT,
    "assignedAdminId" TEXT,
    "createdById" TEXT NOT NULL,
    "escalationReason" TEXT,
    "resolutionSummary" TEXT,
    "requiresIncidentReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SupportTicketComment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketComment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'private_to_participant',
    "fileKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "scanStatus" "DocumentScanStatus" NOT NULL DEFAULT 'not_configured',
    "uploadedById" TEXT NOT NULL,
    "participantId" TEXT,
    "organisationId" TEXT,
    "bookingId" TEXT,
    "supportTicketId" TEXT,
    "invoiceId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ParticipantFundingSource" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "type" "FundingSourceType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "FundingSourceStatus" NOT NULL DEFAULT 'pending_review',
    "planManagerOrganisationId" TEXT,
    "planManagerContactName" TEXT,
    "planManagerEmail" TEXT,
    "planStartDate" TIMESTAMP(3),
    "planEndDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipantFundingSource_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT,
    "bookingId" TEXT,
    "fundingSourceId" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'draft',
    "issueDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "bookingId" TEXT,
    "description" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "unitAmountCents" INTEGER NOT NULL,
    "totalAmountCents" INTEGER NOT NULL,
    "supportItemCode" TEXT,
    "claimableByNdis" BOOLEAN NOT NULL DEFAULT false,
    "privatePayAmountCents" INTEGER,
    "ndisClaimableAmountCents" INTEGER,
    "taxCode" TEXT,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BillingPreflightResult" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "status" "BillingPreflightStatus" NOT NULL,
    "checks" JSONB NOT NULL,
    "failedReasons" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingPreflightResult_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "StripeCustomerLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeCustomerLink_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "StripePaymentIntentRecord" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripePaymentIntentRecord_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "XeroTenantConnection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tenantName" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "XeroTenantConnection_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "XeroContactLink" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "participantId" TEXT,
    "xeroContactId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XeroContactLink_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "XeroInvoiceSyncRecord" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "xeroInvoiceId" TEXT,
    "syncStatus" TEXT NOT NULL DEFAULT 'pending',
    "lastError" TEXT,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "XeroInvoiceSyncRecord_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BookingTimelineEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "eventType" "BookingTimelineEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "actorUserId" TEXT,
    "isAdminOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingTimelineEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "care_requests" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "requestType" "CareRequestType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "recurrencePlaceholder" BOOLEAN NOT NULL DEFAULT false,
    "locationType" TEXT,
    "address" TEXT,
    "suburb" TEXT,
    "state" TEXT,
    "accessRequirementsSummary" TEXT,
    "tasks" JSONB NOT NULL DEFAULT '[]',
    "communicationNotes" TEXT,
    "preferredWorkerAttributes" JSONB,
    "genderPreference" TEXT,
    "supportItemCode" TEXT,
    "fundingSourceId" TEXT,
    "linkedTransportRequired" BOOLEAN NOT NULL DEFAULT false,
    "shareAccessibility" BOOLEAN NOT NULL DEFAULT false,
    "status" "CareRequestStatus" NOT NULL DEFAULT 'draft',
    "createdById" TEXT NOT NULL,
    "assignedOrganisationId" TEXT,
    "assignedWorkerId" TEXT,
    "assignedWorkerProfileId" TEXT,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_requests_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CareShift" (
    "id" TEXT NOT NULL,
    "careRequestId" TEXT NOT NULL,
    "bookingId" TEXT,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "workerProfileId" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "tasks" JSONB NOT NULL DEFAULT '[]',
    "accessRequirementsSnapshot" JSONB,
    "status" "CareShiftStatus" NOT NULL DEFAULT 'scheduled',
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "checkInLatPlaceholder" DOUBLE PRECISION,
    "checkInLngPlaceholder" DOUBLE PRECISION,
    "workerNotes" TEXT,
    "participantApprovalStatus" TEXT NOT NULL DEFAULT 'pending',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareShift_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AvailabilityWindow" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "workerProfileId" TEXT,
    "driverProfileId" TEXT,
    "vehicleId" TEXT,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Australia/Sydney',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityWindow_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CapacityBlock" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "serviceType" TEXT NOT NULL,
    "totalCapacity" INTEGER NOT NULL DEFAULT 0,
    "bookedCapacity" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CapacityBlock_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TransportBooking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "participantId" TEXT NOT NULL,
    "transportType" "TransportBookingType" NOT NULL DEFAULT 'one_way',
    "pickupAddress" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "pickupWindowStart" TIMESTAMP(3) NOT NULL,
    "pickupWindowEnd" TIMESTAMP(3),
    "dropoffAddress" TEXT NOT NULL,
    "dropoffLat" DOUBLE PRECISION,
    "dropoffLng" DOUBLE PRECISION,
    "appointmentTime" TIMESTAMP(3),
    "returnTripRequired" BOOLEAN NOT NULL DEFAULT false,
    "returnPickupTime" TIMESTAMP(3),
    "passengerCount" INTEGER NOT NULL DEFAULT 1,
    "mobilityAidSnapshot" JSONB,
    "vehicleRequirements" JSONB NOT NULL DEFAULT '{}',
    "driverAssistanceRequired" BOOLEAN NOT NULL DEFAULT false,
    "pickupNotes" TEXT,
    "dropoffNotes" TEXT,
    "shareAccessibility" BOOLEAN NOT NULL DEFAULT false,
    "status" "TransportBookingStatus" NOT NULL DEFAULT 'draft',
    "operatorOrganisationId" TEXT,
    "driverProfileId" TEXT,
    "vehicleId" TEXT,
    "careRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportBooking_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "employerOrganisationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "location" TEXT,
    "remoteAllowed" BOOLEAN NOT NULL DEFAULT false,
    "flexibleHours" BOOLEAN NOT NULL DEFAULT false,
    "payRange" TEXT,
    "accessibilityFeatures" JSONB NOT NULL DEFAULT '{}',
    "adjustmentOpennessStatement" TEXT,
    "applicationInstructions" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'draft',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "applicantSummary" TEXT,
    "resumeDocumentId" TEXT,
    "coverLetter" TEXT,
    "reasonableAdjustmentRequest" TEXT,
    "shareAdjustments" BOOLEAN NOT NULL DEFAULT false,
    "transportSupportNeeded" BOOLEAN NOT NULL DEFAULT false,
    "careSupportNeeded" BOOLEAN NOT NULL DEFAULT false,
    "status" "JobApplicationStatus" NOT NULL DEFAULT 'draft',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "eventType" "CalendarEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Australia/Sydney',
    "participantId" TEXT,
    "organisationId" TEXT,
    "bookingId" TEXT,
    "careRequestId" TEXT,
    "careShiftId" TEXT,
    "transportBookingId" TEXT,
    "jobApplicationId" TEXT,
    "jobId" TEXT,
    "visibility" "CalendarVisibility" NOT NULL DEFAULT 'participant_private',
    "externalSyncPlaceholder" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OrchestrationEvent" (
    "id" TEXT NOT NULL,
    "eventType" "OrchestrationEventType" NOT NULL,
    "careRequestId" TEXT,
    "transportBookingId" TEXT,
    "bookingId" TEXT,
    "jobApplicationId" TEXT,
    "careShiftId" TEXT,
    "metadata" JSONB,
    "idempotencyKey" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrchestrationEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MatchRun" (
    "id" TEXT NOT NULL,
    "matchType" "MatchType" NOT NULL,
    "participantId" TEXT,
    "bookingId" TEXT,
    "careRequestId" TEXT,
    "transportBookingId" TEXT,
    "jobApplicationId" TEXT,
    "requestedById" TEXT NOT NULL,
    "status" "MatchRunStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MatchRun_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MatchCandidate" (
    "id" TEXT NOT NULL,
    "matchRunId" TEXT NOT NULL,
    "candidateType" "MatchType" NOT NULL,
    "candidateUserId" TEXT,
    "candidateOrganisationId" TEXT,
    "candidateWorkerId" TEXT,
    "candidateDriverId" TEXT,
    "candidateVehicleId" TEXT,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scoreExplanation" TEXT NOT NULL,
    "status" "MatchCandidateStatus" NOT NULL DEFAULT 'generated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchCandidate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MatchFactor" (
    "id" TEXT NOT NULL,
    "matchCandidateId" TEXT NOT NULL,
    "factorType" "MatchFactorType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "MatchFactor_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MatchDecision" (
    "id" TEXT NOT NULL,
    "matchRunId" TEXT NOT NULL,
    "matchCandidateId" TEXT,
    "decidedById" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchDecision_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SavedProviderSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "queryJson" JSONB NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedProviderSearch_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TripTrackingSession" (
    "id" TEXT NOT NULL,
    "transportBookingId" TEXT NOT NULL,
    "status" "TripTrackingStatus" NOT NULL DEFAULT 'not_started',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripTrackingSession_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TripTrackingEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventType" "TripTrackingEventType" NOT NULL,
    "status" "TripTrackingStatus",
    "message" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripTrackingEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TripLocationPoint" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripLocationPoint_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Timesheet" (
    "id" TEXT NOT NULL,
    "careShiftId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "workerProfileId" TEXT,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "supportItemCode" TEXT,
    "tasksCompleted" JSONB NOT NULL DEFAULT '[]',
    "workerNotes" TEXT,
    "participantFeedback" TEXT,
    "status" "TimesheetStatus" NOT NULL DEFAULT 'draft',
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timesheet_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ServiceAgreement" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "agreementType" "ServiceAgreementType" NOT NULL,
    "title" TEXT NOT NULL,
    "plainLanguageSummary" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "fundingSourceId" TEXT,
    "serviceTypes" JSONB NOT NULL DEFAULT '[]',
    "cancellationTerms" TEXT,
    "pricingSummary" TEXT,
    "participantResponsibilities" TEXT,
    "providerResponsibilities" TEXT,
    "accessCommunicationNotes" TEXT,
    "status" "ServiceAgreementStatus" NOT NULL DEFAULT 'draft',
    "createdById" TEXT NOT NULL,
    "signedByParticipantId" TEXT,
    "signedByProviderId" TEXT,
    "participantSignedAt" TIMESTAMP(3),
    "providerSignedAt" TIMESTAMP(3),
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceAgreement_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdisSupportCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NdisSupportCategory_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdisSupportItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,
    "categoryLabel" TEXT,
    "registrationGroup" TEXT,
    "unitType" TEXT,
    "priceCapCents" INTEGER,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "NdisSupportItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdisLineItemSuggestion" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "supportItemId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "explanation" TEXT NOT NULL,
    "acceptedById" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdisLineItemSuggestion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdisRuleWarning" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "warningType" TEXT NOT NULL,
    "severity" "NdisRuleWarningSeverity" NOT NULL DEFAULT 'warning',
    "message" TEXT NOT NULL,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdisRuleWarning_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SmartContract" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SmartContractType" NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1',
    "status" "SmartContractStatus" NOT NULL DEFAULT 'draft',
    "triggerEvent" TEXT,
    "description" TEXT,
    "rulesJson" JSONB NOT NULL DEFAULT '[]',
    "requiresHumanApproval" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartContract_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SmartContractRule" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "ruleJson" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SmartContractRule_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SmartContractRun" (
    "id" TEXT NOT NULL,
    "smartContractId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "participantId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "result" "ContractRunResult" NOT NULL,
    "contextJson" JSONB,
    "findingsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmartContractRun_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SmartContractRunFinding" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',

    CONSTRAINT "SmartContractRunFinding_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Attestation" (
    "id" TEXT NOT NULL,
    "type" "AttestationType" NOT NULL,
    "status" "AttestationStatus" NOT NULL DEFAULT 'recorded',
    "actorUserId" TEXT,
    "actorOrganisationId" TEXT,
    "participantId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "evidenceJson" JSONB,
    "evidenceHash" TEXT,
    "contractRunId" TEXT,
    "supersededById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attestation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "module" TEXT NOT NULL,
    "metricsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AiMatchRun" (
    "id" TEXT NOT NULL,
    "matchRunId" TEXT,
    "careRequestId" TEXT,
    "transportBookingId" TEXT,
    "status" "AiMatchRunStatus" NOT NULL DEFAULT 'draft',
    "modelVersionId" TEXT,
    "requestedById" TEXT NOT NULL,
    "ruleBasedRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AiMatchRun_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AiMatchCandidate" (
    "id" TEXT NOT NULL,
    "aiMatchRunId" TEXT NOT NULL,
    "matchCandidateId" TEXT,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "aiScore" DOUBLE PRECISION NOT NULL,
    "combinedScore" DOUBLE PRECISION NOT NULL,
    "lowConfidence" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'generated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMatchCandidate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AiMatchExplanation" (
    "id" TEXT NOT NULL,
    "aiMatchCandidateId" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'admin',
    "plainLanguage" TEXT NOT NULL,
    "technicalDetail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMatchExplanation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "FairnessCheck" (
    "id" TEXT NOT NULL,
    "aiMatchRunId" TEXT NOT NULL,
    "status" "FairnessCheckStatus" NOT NULL DEFAULT 'review_required',
    "summary" TEXT NOT NULL,
    "flagsJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FairnessCheck_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "FairnessMetric" (
    "id" TEXT NOT NULL,
    "fairnessCheckId" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "threshold" DOUBLE PRECISION,
    "passed" BOOLEAN NOT NULL DEFAULT true,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "FairnessMetric_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "FairnessReview" (
    "id" TEXT NOT NULL,
    "fairnessCheckId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FairnessReview_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MatchingModelVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'disabled',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchingModelVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProviderVerificationCase" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "status" "VerificationCaseStatus" NOT NULL DEFAULT 'draft',
    "submittedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "adminOwnerId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderVerificationCase_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProviderVerificationCheck" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "checkType" "VerificationCheckType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ProviderVerificationCheck_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProviderVerificationDocument" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "documentId" TEXT,
    "label" TEXT NOT NULL,

    CONSTRAINT "ProviderVerificationDocument_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProviderVerificationDecision" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "decidedById" TEXT NOT NULL,
    "outcome" "VerificationCaseStatus" NOT NULL,
    "conditions" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderVerificationDecision_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProviderRiskRating" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "factorsJson" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderRiskRating_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "VerificationRenewal" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationRenewal_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdisPriceCatalogue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceLabel" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdisPriceCatalogue_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdisPriceCatalogueVersion" (
    "id" TEXT NOT NULL,
    "catalogueId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdisPriceCatalogueVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdisPriceImportJob" (
    "id" TEXT NOT NULL,
    "versionId" TEXT,
    "status" "NdisPriceImportStatus" NOT NULL DEFAULT 'uploaded',
    "fileName" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdisPriceImportJob_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdisPriceImportRow" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "rawJson" JSONB NOT NULL,
    "valid" BOOLEAN NOT NULL DEFAULT true,
    "errors" TEXT,

    CONSTRAINT "NdisPriceImportRow_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdisPriceChange" (
    "id" TEXT NOT NULL,
    "changeType" "NdisPriceChangeType" NOT NULL,
    "supportItemCode" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdisPriceChange_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdisSupportItemPrice" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "supportItemId" TEXT NOT NULL,
    "priceCapCents" INTEGER NOT NULL,
    "unitType" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),

    CONSTRAINT "NdisSupportItemPrice_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdisPriceRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ruleJson" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NdisPriceRule_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "XeroOAuthToken" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "XeroOAuthToken_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "XeroSyncLog" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XeroSyncLog_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "XeroAccountMapping" (
    "id" TEXT NOT NULL,
    "mapableCode" TEXT NOT NULL,
    "xeroCode" TEXT NOT NULL,
    "label" TEXT,

    CONSTRAINT "XeroAccountMapping_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "XeroTaxTypeMapping" (
    "id" TEXT NOT NULL,
    "mapableCode" TEXT NOT NULL,
    "xeroTaxType" TEXT NOT NULL,

    CONSTRAINT "XeroTaxTypeMapping_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "StripeCheckoutSessionRecord" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT,
    "stripeSessionId" TEXT NOT NULL,
    "purpose" "StripePaymentPurpose" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeCheckoutSessionRecord_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "StripeSubscriptionRecord" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "stripeSubscriptionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeSubscriptionRecord_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "StripeRefundRecord" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeRefundRecord_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "StripeDisputeRecord" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requiresReview" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeDisputeRecord_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PaymentReconciliation" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReconciliation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProviderPayoutHold" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderPayoutHold_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RoutePlan" (
    "id" TEXT NOT NULL,
    "transportBookingId" TEXT,
    "status" "RoutePlanStatus" NOT NULL DEFAULT 'draft',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoutePlan_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RouteStop" (
    "id" TEXT NOT NULL,
    "routePlanId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT,

    CONSTRAINT "RouteStop_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RouteConstraint" (
    "id" TEXT NOT NULL,
    "routePlanId" TEXT NOT NULL,
    "type" "RouteConstraintType" NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "RouteConstraint_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RoutePlanCandidate" (
    "id" TEXT NOT NULL,
    "routePlanId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "riskNotes" TEXT,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "RoutePlanCandidate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RoutePlanDecision" (
    "id" TEXT NOT NULL,
    "routePlanId" TEXT NOT NULL,
    "decidedById" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoutePlanDecision_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TravelTimeEstimate" (
    "id" TEXT NOT NULL,
    "routePlanId" TEXT,
    "minutes" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'placeholder',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelTimeEstimate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PlaceLink" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,

    CONSTRAINT "PlaceLink_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SupportCoordinatorRelationship" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "coordinatorId" TEXT NOT NULL,
    "status" "CoordinatorRelationshipStatus" NOT NULL DEFAULT 'pending',
    "consentRecordId" TEXT,
    "scopesJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportCoordinatorRelationship_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SupportCoordinatorTask" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "taskType" "CoordinatorTaskType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportCoordinatorTask_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ParticipantSupportPlanSummary" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "summaryJson" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipantSupportPlanSummary_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CoordinatorAccessRequest" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "coordinatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scopesJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoordinatorAccessRequest_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PlanManagerRelationship" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "planManagerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "consentRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanManagerRelationship_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PlanManagerInvoiceReview" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "planManagerId" TEXT NOT NULL,
    "status" "PlanManagerInvoiceReviewStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanManagerInvoiceReview_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PlanManagerQuery" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "planManagerId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanManagerQuery_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PlanManagerExportBatch" (
    "id" TEXT NOT NULL,
    "planManagerId" TEXT NOT NULL,
    "fileName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'generated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanManagerExportBatch_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EmployerTeamMember" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'recruiter',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployerTeamMember_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "JobPipelineStage" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JobPipelineStage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "JobApplicationStageHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "stageId" TEXT,
    "stageName" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobApplicationStageHistory_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InterviewEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "mode" "InterviewMode" NOT NULL DEFAULT 'video',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InterviewAdjustmentRequest" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "AdjustmentRequestStatus" NOT NULL DEFAULT 'not_requested',
    "details" TEXT,
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewAdjustmentRequest_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EmployerCandidateNote" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployerCandidateNote_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EmployerAccessibilityCommitment" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployerAccessibilityCommitment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ReportingSnapshot" (
    "id" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "category" "ReportingMetricCategory",
    "metricsJson" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportingSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ReportingMetric" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" "ReportingMetricCategory" NOT NULL,
    "definition" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ReportingMetric_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ReportingDimension" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "ReportingDimension_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ReportingExport" (
    "id" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'csv',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportingExport_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DataQualityIssue" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataQualityIssue_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ImpactMetric" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "definition" TEXT NOT NULL,

    CONSTRAINT "ImpactMetric_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DeveloperOrganisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeveloperOrganisation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DeveloperApp" (
    "id" TEXT NOT NULL,
    "developerOrganisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "DeveloperAppStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeveloperApp_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DeveloperApiKey" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scopes" "ApiScope"[],
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeveloperApiKey_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DeveloperWebhookEndpoint" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secretHash" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DeveloperWebhookEndpoint_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DeveloperWebhookDelivery" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeveloperWebhookDelivery_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ApiAccessScope" (
    "id" TEXT NOT NULL,
    "scope" "ApiScope" NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "ApiAccessScope_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ApiUsageLog" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiUsageLog_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ApiRateLimitRule" (
    "id" TEXT NOT NULL,
    "scope" "ApiScope",
    "requestsPerMinute" INTEGER NOT NULL DEFAULT 60,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ApiRateLimitRule_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ComplianceControl" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "status" "ComplianceControlStatus" NOT NULL DEFAULT 'not_started',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceControl_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ComplianceControlEvidence" (
    "id" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "documentId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceControlEvidence_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DataRetentionPolicy" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "retainDays" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DataRetentionPolicy_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DataRetentionJob" (
    "id" TEXT NOT NULL,
    "policyId" TEXT,
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resultJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataRetentionJob_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AdminAccessReview" (
    "id" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAccessReview_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PrivacyImpactAssessment" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivacyImpactAssessment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SecurityException" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "SecurityException_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ComplianceTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceTask_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SecurityFramework" (
    "id" TEXT NOT NULL,
    "type" "SecurityFrameworkType" NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SecurityFramework_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SecurityControl" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',

    CONSTRAINT "SecurityControl_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SecurityEvidence" (
    "id" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "documentId" TEXT,
    "notes" TEXT,

    CONSTRAINT "SecurityEvidence_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SecurityPolicy" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1',

    CONSTRAINT "SecurityPolicy_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SecurityRiskRegisterItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "owner" TEXT,

    CONSTRAINT "SecurityRiskRegisterItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "VendorRiskAssessment" (
    "id" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "notes" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "VendorRiskAssessment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ChangeManagementRecord" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeManagementRecord_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdiaIntegrationProfile" (
    "id" TEXT NOT NULL,
    "mode" "NdiaIntegrationMode" NOT NULL DEFAULT 'not_configured',
    "notes" TEXT,

    CONSTRAINT "NdiaIntegrationProfile_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdiaApiReadinessChecklist" (
    "id" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "NdiaApiReadinessChecklist_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdiaClaimEvidenceBundle" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "referencesJson" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdiaClaimEvidenceBundle_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdiaAdapterConfig" (
    "id" TEXT NOT NULL,
    "adapter" TEXT NOT NULL,
    "configJson" JSONB NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NdiaAdapterConfig_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdiaSubmissionDryRun" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "findingsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdiaSubmissionDryRun_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdiaIntegrationAudit" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdiaIntegrationAudit_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LaunchReadinessItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "LaunchReadinessStatus" NOT NULL DEFAULT 'not_started',
    "evidenceDocumentId" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaunchReadinessItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MobileReleaseTrack" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MobileReleaseTrack_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MobileBuildChecklist" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "MobileBuildChecklist_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AiModelMonitor" (
    "id" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "inputCategory" TEXT NOT NULL,
    "outputCategory" TEXT NOT NULL,
    "reviewOutcome" TEXT,
    "fairnessWarning" BOOLEAN NOT NULL DEFAULT false,
    "humanOverride" BOOLEAN NOT NULL DEFAULT false,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiModelMonitor_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AiGovernanceIncident" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "summary" TEXT NOT NULL,
    "resolution" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiGovernanceIncident_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DispatchQueue" (
    "id" TEXT NOT NULL,
    "queueType" "DispatchQueueType" NOT NULL,
    "priority" "DispatchQueuePriority" NOT NULL DEFAULT 'normal',
    "title" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "organisationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "plainLanguageSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchQueue_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DispatchAction" (
    "id" TEXT NOT NULL,
    "queueId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchAction_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProviderQualityScore" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "factorsJson" JSONB NOT NULL DEFAULT '[]',
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderQualityScore_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProviderSafeguardReview" (
    "id" TEXT NOT NULL,
    "scoreId" TEXT,
    "organisationId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderSafeguardReview_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PlanManagerIntegrationProfile" (
    "id" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "exportFormat" TEXT NOT NULL DEFAULT 'csv',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "configJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanManagerIntegrationProfile_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PartnerSandboxApp" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sandbox',
    "scopesJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerSandboxApp_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SandboxWebhookDelivery" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SandboxWebhookDelivery_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OpenDataExport" (
    "id" TEXT NOT NULL,
    "datasetKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "suppressedCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpenDataExport_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GovernmentReportPack" (
    "id" TEXT NOT NULL,
    "packType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "contentJson" JSONB NOT NULL DEFAULT '{}',
    "submittedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernmentReportPack_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DisasterRecoveryPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1',
    "status" TEXT NOT NULL DEFAULT 'active',
    "checklistJson" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisasterRecoveryPlan_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DisasterRecoveryExercise" (
    "id" TEXT NOT NULL,
    "planId" TEXT,
    "title" TEXT NOT NULL,
    "outcome" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "conductedAt" TIMESTAMP(3),
    "evidenceJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisasterRecoveryExercise_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EvidenceAutomationJob" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resultJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceAutomationJob_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BoardReportSnapshot" (
    "id" TEXT NOT NULL,
    "reportPeriod" TEXT NOT NULL,
    "metricsJson" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardReportSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CommunityGovernanceMeeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meetingAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityGovernanceMeeting_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CommunityGovernanceDecision" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'recorded',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityGovernanceDecision_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TenantMembership" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantMembership_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EnterpriseProviderWorkspace" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "organisationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnterpriseProviderWorkspace_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GovernmentPartnerWorkspace" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernmentPartnerWorkspace_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MobileReleaseCandidate" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "accessibilityStatus" TEXT NOT NULL DEFAULT 'pending',
    "privacyStatus" TEXT NOT NULL DEFAULT 'pending',
    "releaseStatus" TEXT NOT NULL DEFAULT 'candidate',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MobileReleaseCandidate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MobileReleaseBlocker" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MobileReleaseBlocker_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OperatorDispatchBoard" (
    "id" TEXT NOT NULL,
    "transportBookingId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "assignedDriverId" TEXT,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorDispatchBoard_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DispatchReassignment" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "fromDriverId" TEXT,
    "toDriverId" TEXT,
    "reason" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchReassignment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CancellationResolution" (
    "id" TEXT NOT NULL,
    "transportBookingId" TEXT,
    "careShiftId" TEXT,
    "reason" TEXT NOT NULL,
    "resolution" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CancellationResolution_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProviderOnboardingWorkflow" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderOnboardingWorkflow_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProviderOnboardingTask" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "taskKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueAt" TIMESTAMP(3),

    CONSTRAINT "ProviderOnboardingTask_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PaymentReconciliationBatch" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReconciliationBatch_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PaymentReconciliationException" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "stripePaymentId" TEXT,
    "xeroInvoiceId" TEXT,
    "matchStatus" "ReconciliationMatchStatus" NOT NULL DEFAULT 'unmatched',
    "amountCents" INTEGER,
    "notes" TEXT,

    CONSTRAINT "PaymentReconciliationException_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PlanManagerPilotPartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "exportFormat" TEXT NOT NULL DEFAULT 'csv',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanManagerPilotPartner_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PlanManagerPilotExport" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'generated',
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanManagerPilotExport_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdiaPilotApprovalRecord" (
    "id" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "NdiaPilotApprovalRecord_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdiaPilotSubmissionDryRun" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT,
    "result" TEXT NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT true,
    "message" TEXT NOT NULL DEFAULT 'NDIA pilot disabled — dry run only',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdiaPilotSubmissionDryRun_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PublicAccreditationProfile" (
    "id" TEXT NOT NULL,
    "caseId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "disclaimer" TEXT NOT NULL DEFAULT 'Community or MapAble assessment — not legal certification unless stated.',

    CONSTRAINT "PublicAccreditationProfile_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AiMonitoringDashboardSnapshot" (
    "id" TEXT NOT NULL,
    "metricsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMonitoringDashboardSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TransparencyPublication" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransparencyPublication_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DisasterRecoveryExerciseStep" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "passed" BOOLEAN,
    "notes" TEXT,

    CONSTRAINT "DisasterRecoveryExerciseStep_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PublicBetaCohort" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicBetaCohort_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PublicBetaFeedback" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT,
    "userId" TEXT,
    "category" "PublicBetaFeedbackCategory" NOT NULL DEFAULT 'accessibility',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicBetaFeedback_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SocialImpactOutcome" (
    "id" TEXT NOT NULL,
    "outcomeKey" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "cohortSize" INTEGER NOT NULL,
    "suppressed" BOOLEAN NOT NULL DEFAULT false,
    "definition" TEXT NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialImpactOutcome_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ScalePlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "summary" TEXT,
    "boardApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScalePlan_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ScalePlanMilestone" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ScalePlanMilestone_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AppStoreReleaseSubmission" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "track" TEXT NOT NULL DEFAULT 'production',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "submittedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppStoreReleaseSubmission_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AppStoreReleaseChecklistItem" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AppStoreReleaseChecklistItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TransportNetworkRegion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TransportNetworkRolloutStatus" NOT NULL DEFAULT 'planned',
    "rolloutPercent" INTEGER NOT NULL DEFAULT 0,
    "operatorCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportNetworkRegion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ComplianceRenewal" (
    "id" TEXT NOT NULL,
    "controlCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "renewedAt" TIMESTAMP(3),
    "evidenceJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceRenewal_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SettlementBatch" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementBatch_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SettlementBatchLine" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "SettlementBatchLine_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NationalInsightSnapshot" (
    "id" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "metricsJson" JSONB NOT NULL,
    "suppressed" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NationalInsightSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PublicApiVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" "PublicApiVersionStatus" NOT NULL DEFAULT 'stable',
    "sunsetAt" TIMESTAMP(3),
    "changelog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicApiVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SlaReport" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "availabilityPercent" DOUBLE PRECISION,
    "p95ResponseMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metricsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlaReport_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GrantReport" (
    "id" TEXT NOT NULL,
    "grantCode" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "outcomesJson" JSONB,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrantReport_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ExternalSecurityAuditPack" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "evidenceJson" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalSecurityAuditPack_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AssessorCase" (
    "id" TEXT NOT NULL,
    "assessorUserId" TEXT,
    "referenceCode" TEXT,
    "caseType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessorCase_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PlatformStatusCheck" (
    "id" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformStatusCheck_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DataTrustCouncilRecord" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "meetingAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataTrustCouncilRecord_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PartnerMarketplaceListing" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerMarketplaceListing_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NationalRolloutStage" (
    "id" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "percentComplete" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NationalRolloutStage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PartnerBillingAccount" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "planCode" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'active',
    "billingEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerBillingAccount_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PartnerBillingInvoice" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerBillingInvoice_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PartnerApiProgramEnrollment" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "programTier" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerApiProgramEnrollment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AssessorNetworkMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credential" TEXT,
    "regions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessorNetworkMember_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PublicDecisionRecord" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "decisionType" TEXT NOT NULL,
    "rationale" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicDecisionRecord_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PersonalDataVaultRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestType" "DataVaultRequestType" NOT NULL,
    "status" "DataVaultRequestStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalDataVaultRequest_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ResearchSafeRoomProject" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "ethicsApprovalId" TEXT,
    "accessPolicy" TEXT NOT NULL DEFAULT 'restricted',
    "syntheticDataOnly" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchSafeRoomProject_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProviderBenchmarkSnapshot" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "metricKey" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "cohortSize" INTEGER NOT NULL DEFAULT 0,
    "suppressed" BOOLEAN NOT NULL DEFAULT false,
    "periodLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderBenchmarkSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GovernanceCharter" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "ratifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernanceCharter_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LocaleTranslation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "namespace" TEXT NOT NULL DEFAULT 'common',
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocaleTranslation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LongitudinalImpactWave" (
    "id" TEXT NOT NULL,
    "waveLabel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'collecting',
    "metricsJson" JSONB,
    "suppressed" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LongitudinalImpactWave_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ApiCertificationApplication" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "status" "ApiCertificationStatus" NOT NULL DEFAULT 'draft',
    "reviewNotes" TEXT,
    "certifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiCertificationApplication_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RegisteredAlgorithm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "owner" TEXT,
    "status" "AlgorithmRegisterStatus" NOT NULL DEFAULT 'draft',
    "fairnessNotes" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegisteredAlgorithm_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OversightBoardMeeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "meetingAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OversightBoardMeeting_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OversightBoardDecision" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'recorded',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OversightBoardDecision_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PrivacyPreservingAnalyticsRun" (
    "id" TEXT NOT NULL,
    "runLabel" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'differential_privacy_placeholder',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "epsilon" DOUBLE PRECISION,
    "resultJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivacyPreservingAnalyticsRun_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "FederatedResearchAgreement" (
    "id" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvedAt" TIMESTAMP(3),
    "syntheticOnly" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FederatedResearchAgreement_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProviderAcademyCourse" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderAcademyCourse_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProviderAcademyEnrollment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'enrolled',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderAcademyEnrollment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DataTrustAnnualReport" (
    "id" TEXT NOT NULL,
    "yearLabel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "reportJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataTrustAnnualReport_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SustainabilityPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SustainabilityPlan_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SustainabilityMilestone" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetYear" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SustainabilityMilestone_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LongTermOutcomeSnapshot" (
    "id" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "outcomeKey" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "suppressed" BOOLEAN NOT NULL DEFAULT false,
    "narrative" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LongTermOutcomeSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NationalAccountabilityPublication" (
    "id" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metricsJson" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NationalAccountabilityPublication_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ConstitutionalSafeguard" (
    "id" TEXT NOT NULL,
    "articleKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "ratifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConstitutionalSafeguard_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CommunityGovernanceMembership" (
    "id" TEXT NOT NULL,
    "memberLabel" TEXT NOT NULL,
    "membershipType" TEXT NOT NULL DEFAULT 'community',
    "region" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disclaimer" TEXT NOT NULL DEFAULT 'Directory entry only — no personal contact details published.',

    CONSTRAINT "CommunityGovernanceMembership_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TransportInvestmentModelRun" (
    "id" TEXT NOT NULL,
    "scenarioKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "regionCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "inputsJson" JSONB,
    "outputsJson" JSONB,
    "suppressed" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportInvestmentModelRun_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CertifiedApiEcosystemEntry" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "certificationTier" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'listed',
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "CertifiedApiEcosystemEntry_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ResearchFederationNode" (
    "id" TEXT NOT NULL,
    "nodeName" TEXT NOT NULL,
    "institution" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "syntheticOnly" BOOLEAN NOT NULL DEFAULT true,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchFederationNode_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InstitutionalContinuityPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionalContinuityPlan_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InstitutionalContinuityCheckpoint" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "InstitutionalContinuityCheckpoint_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CivicAuditIndexEntry" (
    "id" TEXT NOT NULL,
    "auditYear" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "findingsJson" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CivicAuditIndexEntry_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "FederatedAccountabilityPartner" (
    "id" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "jurisdiction" TEXT,
    "scope" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FederatedAccountabilityPartner_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BillingAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "BillingAccountRole" NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeConnectedAccountId" TEXT,
    "connectOnboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "defaultFundingSourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingAccount_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BillingFundingSource" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "billingAccountId" TEXT,
    "type" "BillingFundingSourceType" NOT NULL,
    "label" TEXT NOT NULL,
    "ndisParticipantNumber" TEXT,
    "planManagerName" TEXT,
    "planManagerEmail" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingFundingSource_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BillingInvoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerId" TEXT,
    "bookingId" TEXT,
    "legacyInvoiceId" TEXT,
    "serviceType" "BillingServiceType" NOT NULL,
    "status" "BillingInvoiceStatus" NOT NULL DEFAULT 'draft',
    "fundingSourceId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "platformFeeCents" INTEGER NOT NULL DEFAULT 0,
    "gstCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "ndisLineItem" TEXT,
    "ndisClaimable" BOOLEAN NOT NULL DEFAULT false,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeInvoiceId" TEXT,
    "xeroExportStatus" TEXT,
    "planManagerExportStatus" TEXT,
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingInvoice_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BillingInvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "unitAmountCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "ndisLineItem" TEXT,
    "gstApplicable" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingInvoiceLineItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BillingPayment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerId" TEXT,
    "status" "BillingPaymentStatus" NOT NULL DEFAULT 'requires_payment',
    "method" "BillingPaymentMethod" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "failureReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPayment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BillingPaymentSplit" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "recipientType" "BillingPaymentSplitRecipient" NOT NULL,
    "recipientId" TEXT,
    "stripeConnectedAccountId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "applicationFeeCents" INTEGER NOT NULL DEFAULT 0,
    "transferId" TEXT,
    "status" "BillingPaymentSplitStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPaymentSplit_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BillingSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "billingAccountId" TEXT NOT NULL,
    "planCode" "BillingSubscriptionPlanCode" NOT NULL,
    "status" "BillingSubscriptionStatus" NOT NULL DEFAULT 'incomplete',
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingSubscription_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BillingStripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "BillingStripeWebhookEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BillingAuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingAuditLog_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdiaProviderClaim" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "legacyInvoiceId" TEXT,
    "billingInvoiceId" TEXT,
    "participantId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "ndisRegistrationNumber" TEXT NOT NULL,
    "status" "NdiaProviderClaimStatus" NOT NULL DEFAULT 'draft',
    "claimPayloadJson" JSONB NOT NULL,
    "validationFindingsJson" JSONB,
    "externalClaimId" TEXT,
    "externalStatus" TEXT,
    "submittedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NdiaProviderClaim_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NdiaProviderClaimAudit" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdiaProviderClaimAudit_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "care_bookings" (
    "id" TEXT NOT NULL,
    "careRequestId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "status" "CareBookingStatus" NOT NULL DEFAULT 'pending_provider',
    "scheduledStartAt" TIMESTAMP(3),
    "scheduledEndAt" TIMESTAMP(3),
    "location" TEXT,
    "tasks" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "care_bookings_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "care_service_recovery_links" (
    "id" TEXT NOT NULL,
    "careBookingId" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "care_service_recovery_links_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "care_service_logs" (
    "id" TEXT NOT NULL,
    "careBookingId" TEXT NOT NULL,
    "careShiftId" TEXT,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "workerProfileId" TEXT,
    "status" "CareServiceLogStatus" NOT NULL DEFAULT 'draft',
    "supportsDelivered" JSONB NOT NULL DEFAULT '[]',
    "durationMinutes" INTEGER,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "disputeReason" TEXT,
    "disputedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "care_service_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "care_bookings_careRequestId_key" ON "care_bookings"("careRequestId");
CREATE INDEX IF NOT EXISTS "care_bookings_participantId_status_idx" ON "care_bookings"("participantId", "status");
CREATE INDEX IF NOT EXISTS "care_bookings_organisationId_status_idx" ON "care_bookings"("organisationId", "status");
CREATE INDEX IF NOT EXISTS "care_service_recovery_links_careBookingId_idx" ON "care_service_recovery_links"("careBookingId");
CREATE UNIQUE INDEX IF NOT EXISTS "care_service_logs_careShiftId_key" ON "care_service_logs"("careShiftId");
CREATE INDEX IF NOT EXISTS "care_service_logs_careBookingId_status_idx" ON "care_service_logs"("careBookingId", "status");
CREATE INDEX IF NOT EXISTS "care_service_logs_participantId_idx" ON "care_service_logs"("participantId");
CREATE INDEX IF NOT EXISTS "WorkerProfile_organisationId_active_idx" ON "WorkerProfile"("organisationId", "active");

-- Foreign keys
ALTER TABLE "provider_services" ADD CONSTRAINT "provider_services_providerProfileId_fkey" FOREIGN KEY ("providerProfileId") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_services" ADD CONSTRAINT "provider_services_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
