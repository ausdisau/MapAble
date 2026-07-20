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
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Australia/Sydney',
    "locale" TEXT NOT NULL DEFAULT 'en-AU',
    "preferredContactMethod" "PreferredContactMethod" NOT NULL DEFAULT 'email',
    "primaryRole" "MapAbleUserRole" NOT NULL DEFAULT 'participant',
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "qualifications" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerAvailability" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "WorkerAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Specialisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimedProvider" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "outletKey" TEXT,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "description" TEXT,
    "openingHours" TEXT,
    "suburb" TEXT,
    "state" TEXT,
    "postcode" TEXT,
    "categories" TEXT[],
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimedProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "provider_services" (
    "id" TEXT NOT NULL,
    "providerProfileId" TEXT NOT NULL,
    "serviceCategoryId" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "provider_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accessibility_features" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accessibility_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "popular_searches" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT 'all',
    "weight" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "popular_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_languages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "abn" TEXT,
    "businessType" TEXT,
    "ndisRegistered" BOOLEAN NOT NULL DEFAULT false,
    "ndisNumber" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "serviceAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specialisations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderUserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "role" "ProviderRole" NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderUserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "providerId" TEXT NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceLocation" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "postcode" TEXT,
    "country" TEXT,
    "providerId" TEXT NOT NULL,

    CONSTRAINT "ServiceLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessHour" (
    "id" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,

    CONSTRAINT "BusinessHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerProvider" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),

    CONSTRAINT "WorkerProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MapAbleUserRole" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "preferredName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "ndisParticipantNumberEnc" TEXT,
    "primaryContactMethod" "PreferredContactMethod" NOT NULL DEFAULT 'email',
    "emergencyContact" JSONB,
    "supportCoordinatorContact" JSONB,
    "planManagerContact" JSONB,
    "homeSuburb" TEXT,
    "homeState" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Australia/Sydney',
    "participantNotes" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessibilityProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mobilityNeeds" JSONB NOT NULL DEFAULT '[]',
    "communicationPreferences" JSONB NOT NULL DEFAULT '[]',
    "sensoryPreferences" JSONB NOT NULL DEFAULT '{}',
    "cognitivePreferences" JSONB NOT NULL DEFAULT '{}',
    "transportRequirements" JSONB NOT NULL DEFAULT '{}',
    "digitalPreferences" JSONB NOT NULL DEFAULT '{}',
    "shareWithProviders" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessibilityProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abn" TEXT,
    "organisationType" "OrganisationType" NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "serviceRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "OrganisationStatus" NOT NULL DEFAULT 'active',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'not_started',
    "ndisRegistrationClaimed" BOOLEAN NOT NULL DEFAULT false,
    "ndisRegistrationNumber" TEXT,
    "insuranceStatus" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "role" "MapAbleUserRole" NOT NULL DEFAULT 'provider_admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganisationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "grantedToUserId" TEXT,
    "grantedToOrganisationId" TEXT,
    "scope" "ConsentScope" NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'active',
    "expiryDate" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "revokedById" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorRole" "MapAbleUserRole",
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "participantId" TEXT,
    "organisationId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "bookingType" "BookingType" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'draft',
    "requestedStart" TIMESTAMP(3) NOT NULL,
    "requestedEnd" TIMESTAMP(3),
    "pickupAddress" TEXT,
    "dropoffAddress" TEXT,
    "careLocation" TEXT,
    "accessibilitySummary" TEXT,
    "participantNotes" TEXT,
    "providerNotes" TEXT,
    "assignedOrganisationId" TEXT,
    "assignedWorkerId" TEXT,
    "assignedDriverId" TEXT,
    "fundingSourceTag" TEXT,
    "shareAccessibility" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "providerResponseStatus" "ProviderResponseStatus" NOT NULL DEFAULT 'not_sent',
    "providerResponseNote" TEXT,
    "providerRespondedAt" TIMESTAMP(3),
    "fundingSourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingSegment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "segmentType" TEXT NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "pickupAddress" TEXT,
    "dropoffAddress" TEXT,
    "bufferBeforeMinutes" INTEGER NOT NULL DEFAULT 0,
    "bufferAfterMinutes" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "MessageReadReceipt" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReadReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "SupportTicketComment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "StripeCustomerLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeCustomerLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "XeroContactLink" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "participantId" TEXT,
    "xeroContactId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XeroContactLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "CareRequest" (
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

    CONSTRAINT "CareRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "WorkerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organisationId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "profileSummary" TEXT,
    "serviceTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "serviceRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "communicationCapabilities" JSONB NOT NULL DEFAULT '[]',
    "qualificationsSummary" TEXT,
    "workerScreeningStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'not_provided',
    "wwccStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'not_provided',
    "firstAidStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'not_provided',
    "insuranceStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'not_provided',
    "verificationStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'pending_review',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "vehicleType" "VehicleType" NOT NULL DEFAULT 'standard_car',
    "registrationNumber" TEXT,
    "wheelchairAccessible" BOOLEAN NOT NULL DEFAULT false,
    "rampAvailable" BOOLEAN NOT NULL DEFAULT false,
    "liftAvailable" BOOLEAN NOT NULL DEFAULT false,
    "wheelchairSpaces" INTEGER NOT NULL DEFAULT 0,
    "seatedCapacity" INTEGER NOT NULL DEFAULT 4,
    "canCarryPowerWheelchair" BOOLEAN NOT NULL DEFAULT false,
    "assistanceAnimalFriendly" BOOLEAN NOT NULL DEFAULT true,
    "airConditioning" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "verificationStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'pending_review',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organisationId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "phone" TEXT,
    "serviceRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "licenceStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'not_provided',
    "accessibilityTrainingStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'not_provided',
    "workerScreeningStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'not_provided',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "verificationStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'pending_review',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "MatchFactor" (
    "id" TEXT NOT NULL,
    "matchCandidateId" TEXT NOT NULL,
    "factorType" "MatchFactorType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "MatchFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "SavedProviderSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "queryJson" JSONB NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedProviderSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "TripLocationPoint" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripLocationPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "IncidentReport" (
    "id" TEXT NOT NULL,
    "category" "IncidentCategory" NOT NULL,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'medium',
    "status" "IncidentStatus" NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "participantId" TEXT,
    "bookingId" TEXT,
    "careShiftId" TEXT,
    "transportBookingId" TEXT,
    "organisationId" TEXT,
    "workerProfileId" TEXT,
    "driverProfileId" TEXT,
    "vehicleId" TEXT,
    "reportedById" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3),
    "immediateRiskPresent" BOOLEAN NOT NULL DEFAULT false,
    "possibleReportableIncident" BOOLEAN NOT NULL DEFAULT false,
    "safeguardingConcern" BOOLEAN NOT NULL DEFAULT false,
    "adminOwnerId" TEXT,
    "adminAcknowledgedAt" TIMESTAMP(3),
    "resolutionSummary" TEXT,
    "externalReportRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "IncidentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentUpdate" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentAction" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentEvidence" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "documentId" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "NdisSupportCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NdisSupportCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "SmartContractRule" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "ruleJson" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SmartContractRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "SmartContractRunFinding" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',

    CONSTRAINT "SmartContractRunFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "module" TEXT NOT NULL,
    "metricsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "AiMatchExplanation" (
    "id" TEXT NOT NULL,
    "aiMatchCandidateId" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'admin',
    "plainLanguage" TEXT NOT NULL,
    "technicalDetail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMatchExplanation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FairnessCheck" (
    "id" TEXT NOT NULL,
    "aiMatchRunId" TEXT NOT NULL,
    "status" "FairnessCheckStatus" NOT NULL DEFAULT 'review_required',
    "summary" TEXT NOT NULL,
    "flagsJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FairnessCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "FairnessReview" (
    "id" TEXT NOT NULL,
    "fairnessCheckId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FairnessReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchingModelVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'disabled',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchingModelVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "ProviderVerificationCheck" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "checkType" "VerificationCheckType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ProviderVerificationCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderVerificationDocument" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "documentId" TEXT,
    "label" TEXT NOT NULL,

    CONSTRAINT "ProviderVerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "ProviderRiskRating" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "factorsJson" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderRiskRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRenewal" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationRenewal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdisPriceCatalogue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceLabel" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdisPriceCatalogue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdisPriceCatalogueVersion" (
    "id" TEXT NOT NULL,
    "catalogueId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdisPriceCatalogueVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "NdisPriceImportRow" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "rawJson" JSONB NOT NULL,
    "valid" BOOLEAN NOT NULL DEFAULT true,
    "errors" TEXT,

    CONSTRAINT "NdisPriceImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdisPriceChange" (
    "id" TEXT NOT NULL,
    "changeType" "NdisPriceChangeType" NOT NULL,
    "supportItemCode" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdisPriceChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "NdisPriceRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ruleJson" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NdisPriceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "XeroSyncLog" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XeroSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XeroAccountMapping" (
    "id" TEXT NOT NULL,
    "mapableCode" TEXT NOT NULL,
    "xeroCode" TEXT NOT NULL,
    "label" TEXT,

    CONSTRAINT "XeroAccountMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XeroTaxTypeMapping" (
    "id" TEXT NOT NULL,
    "mapableCode" TEXT NOT NULL,
    "xeroTaxType" TEXT NOT NULL,

    CONSTRAINT "XeroTaxTypeMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "StripeSubscriptionRecord" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "stripeSubscriptionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeSubscriptionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeRefundRecord" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeRefundRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeDisputeRecord" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requiresReview" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeDisputeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReconciliation" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderPayoutHold" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderPayoutHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutePlan" (
    "id" TEXT NOT NULL,
    "transportBookingId" TEXT,
    "status" "RoutePlanStatus" NOT NULL DEFAULT 'draft',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoutePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteStop" (
    "id" TEXT NOT NULL,
    "routePlanId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT,

    CONSTRAINT "RouteStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteConstraint" (
    "id" TEXT NOT NULL,
    "routePlanId" TEXT NOT NULL,
    "type" "RouteConstraintType" NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "RouteConstraint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutePlanCandidate" (
    "id" TEXT NOT NULL,
    "routePlanId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "riskNotes" TEXT,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "RoutePlanCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutePlanDecision" (
    "id" TEXT NOT NULL,
    "routePlanId" TEXT NOT NULL,
    "decidedById" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoutePlanDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelTimeEstimate" (
    "id" TEXT NOT NULL,
    "routePlanId" TEXT,
    "minutes" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'placeholder',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelTimeEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessiblePlace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "confidence" "AccessibilityConfidence" NOT NULL DEFAULT 'unknown',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessiblePlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessibilityFeature" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "type" "AccessibilityFeatureType" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "AccessibilityFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessibilityReview" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "moderated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessibilityReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessibilityAssessment" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "assessorId" TEXT,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessibilityAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessibilityDataSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "AccessibilityDataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceLink" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,

    CONSTRAINT "PlaceLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "SupportCoordinatorTask" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "taskType" "CoordinatorTaskType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportCoordinatorTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantSupportPlanSummary" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "summaryJson" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipantSupportPlanSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoordinatorAccessRequest" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "coordinatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scopesJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoordinatorAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanManagerRelationship" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "planManagerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "consentRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanManagerRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanManagerInvoiceReview" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "planManagerId" TEXT NOT NULL,
    "status" "PlanManagerInvoiceReviewStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanManagerInvoiceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanManagerQuery" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "planManagerId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanManagerQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanManagerExportBatch" (
    "id" TEXT NOT NULL,
    "planManagerId" TEXT NOT NULL,
    "fileName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'generated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanManagerExportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerTeamMember" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'recruiter',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployerTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPipelineStage" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JobPipelineStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplicationStageHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "stageId" TEXT,
    "stageName" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobApplicationStageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "InterviewAdjustmentRequest" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "AdjustmentRequestStatus" NOT NULL DEFAULT 'not_requested',
    "details" TEXT,
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewAdjustmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerCandidateNote" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployerCandidateNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerAccessibilityCommitment" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployerAccessibilityCommitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportingSnapshot" (
    "id" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "category" "ReportingMetricCategory",
    "metricsJson" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportingMetric" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" "ReportingMetricCategory" NOT NULL,
    "definition" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ReportingMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportingDimension" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "ReportingDimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportingExport" (
    "id" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'csv',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportingExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataQualityIssue" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataQualityIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactMetric" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "definition" TEXT NOT NULL,

    CONSTRAINT "ImpactMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperOrganisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeveloperOrganisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperApp" (
    "id" TEXT NOT NULL,
    "developerOrganisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "DeveloperAppStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeveloperApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "DeveloperWebhookEndpoint" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secretHash" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DeveloperWebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperWebhookDelivery" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeveloperWebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiAccessScope" (
    "id" TEXT NOT NULL,
    "scope" "ApiScope" NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "ApiAccessScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiUsageLog" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRateLimitRule" (
    "id" TEXT NOT NULL,
    "scope" "ApiScope",
    "requestsPerMinute" INTEGER NOT NULL DEFAULT 60,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ApiRateLimitRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "ComplianceControlEvidence" (
    "id" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "documentId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceControlEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRetentionPolicy" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "retainDays" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DataRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRetentionJob" (
    "id" TEXT NOT NULL,
    "policyId" TEXT,
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resultJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataRetentionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAccessReview" (
    "id" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAccessReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyImpactAssessment" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivacyImpactAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityException" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "SecurityException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityFramework" (
    "id" TEXT NOT NULL,
    "type" "SecurityFrameworkType" NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SecurityFramework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityControl" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',

    CONSTRAINT "SecurityControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvidence" (
    "id" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "documentId" TEXT,
    "notes" TEXT,

    CONSTRAINT "SecurityEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityPolicy" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1',

    CONSTRAINT "SecurityPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityRiskRegisterItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "owner" TEXT,

    CONSTRAINT "SecurityRiskRegisterItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorRiskAssessment" (
    "id" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "notes" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "VendorRiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessReview" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AccessReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeManagementRecord" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeManagementRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentResponseExercise" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "conductedAt" TIMESTAMP(3),
    "outcome" TEXT,

    CONSTRAINT "IncidentResponseExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdiaIntegrationProfile" (
    "id" TEXT NOT NULL,
    "mode" "NdiaIntegrationMode" NOT NULL DEFAULT 'not_configured',
    "notes" TEXT,

    CONSTRAINT "NdiaIntegrationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdiaApiReadinessChecklist" (
    "id" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "NdiaApiReadinessChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdiaClaimEvidenceBundle" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "referencesJson" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdiaClaimEvidenceBundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdiaAdapterConfig" (
    "id" TEXT NOT NULL,
    "adapter" TEXT NOT NULL,
    "configJson" JSONB NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NdiaAdapterConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdiaSubmissionDryRun" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "findingsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdiaSubmissionDryRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdiaIntegrationAudit" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdiaIntegrationAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "MobileReleaseTrack" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MobileReleaseTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobileBuildChecklist" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "MobileBuildChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "DispatchAction" (
    "id" TEXT NOT NULL,
    "queueId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "PlanManagerIntegrationProfile" (
    "id" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "exportFormat" TEXT NOT NULL DEFAULT 'csv',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "configJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanManagerIntegrationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerSandboxApp" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sandbox',
    "scopesJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerSandboxApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SandboxWebhookDelivery" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SandboxWebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessibilityAccreditationCase" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "assessmentType" "AccreditationAssessmentType" NOT NULL DEFAULT 'mapable_assessment',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "disclaimer" TEXT NOT NULL DEFAULT 'Not legal certification unless formal external audit recorded.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessibilityAccreditationCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessibilityAccreditationScore" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "criterion" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,

    CONSTRAINT "AccessibilityAccreditationScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "DisasterRecoveryPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1',
    "status" TEXT NOT NULL DEFAULT 'active',
    "checklistJson" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisasterRecoveryPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "EvidenceAutomationJob" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resultJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceAutomationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardReportSnapshot" (
    "id" TEXT NOT NULL,
    "reportPeriod" TEXT NOT NULL,
    "metricsJson" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardReportSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityGovernanceMeeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meetingAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityGovernanceMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityGovernanceDecision" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'recorded',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityGovernanceDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantMembership" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseProviderWorkspace" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "organisationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnterpriseProviderWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernmentPartnerWorkspace" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernmentPartnerWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "MobileReleaseBlocker" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MobileReleaseBlocker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatorDispatchBoard" (
    "id" TEXT NOT NULL,
    "transportBookingId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "assignedDriverId" TEXT,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorDispatchBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "ProviderOnboardingWorkflow" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderOnboardingWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderOnboardingTask" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "taskKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueAt" TIMESTAMP(3),

    CONSTRAINT "ProviderOnboardingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReconciliationBatch" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReconciliationBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "PlanManagerPilotPartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "exportFormat" TEXT NOT NULL DEFAULT 'csv',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanManagerPilotPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanManagerPilotExport" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'generated',
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanManagerPilotExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdiaPilotApprovalRecord" (
    "id" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "NdiaPilotApprovalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdiaPilotSubmissionDryRun" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT,
    "result" TEXT NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT true,
    "message" TEXT NOT NULL DEFAULT 'NDIA pilot disabled — dry run only',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdiaPilotSubmissionDryRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "AiMonitoringDashboardSnapshot" (
    "id" TEXT NOT NULL,
    "metricsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMonitoringDashboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "DisasterRecoveryExerciseStep" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "passed" BOOLEAN,
    "notes" TEXT,

    CONSTRAINT "DisasterRecoveryExerciseStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicBetaCohort" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicBetaCohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicBetaFeedback" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT,
    "userId" TEXT,
    "category" "PublicBetaFeedbackCategory" NOT NULL DEFAULT 'accessibility',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicBetaFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "ScalePlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "summary" TEXT,
    "boardApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScalePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScalePlanMilestone" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ScalePlanMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "AppStoreReleaseChecklistItem" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AppStoreReleaseChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "SettlementBatchLine" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "SettlementBatchLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NationalInsightSnapshot" (
    "id" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "metricsJson" JSONB NOT NULL,
    "suppressed" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NationalInsightSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicApiVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" "PublicApiVersionStatus" NOT NULL DEFAULT 'stable',
    "sunsetAt" TIMESTAMP(3),
    "changelog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicApiVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "PlatformStatusCheck" (
    "id" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformStatusCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataTrustCouncilRecord" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "meetingAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataTrustCouncilRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "PartnerBillingAccount" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "planCode" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'active',
    "billingEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerBillingAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "PartnerApiProgramEnrollment" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "programTier" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerApiProgramEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessorNetworkMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credential" TEXT,
    "regions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessorNetworkMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "LocaleTranslation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "namespace" TEXT NOT NULL DEFAULT 'common',
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocaleTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "OversightBoardMeeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "meetingAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OversightBoardMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "ProviderAcademyCourse" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderAcademyCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderAcademyEnrollment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'enrolled',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderAcademyEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "SustainabilityPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SustainabilityPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SustainabilityMilestone" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetYear" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SustainabilityMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "InstitutionalContinuityPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionalContinuityPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionalContinuityCheckpoint" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "InstitutionalContinuityCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "FederatedAccountabilityPartner" (
    "id" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "jurisdiction" TEXT,
    "scope" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FederatedAccountabilityPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateIndex
CREATE INDEX "_LanguageToWorker_B_index" ON "_LanguageToWorker"("B");

-- CreateIndex
CREATE INDEX "_SpecialisationToWorker_B_index" ON "_SpecialisationToWorker"("B");

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAvailability" ADD CONSTRAINT "WorkerAvailability_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimedProvider" ADD CONSTRAINT "ClaimedProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_services" ADD CONSTRAINT "provider_services_providerProfileId_fkey" FOREIGN KEY ("providerProfileId") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_services" ADD CONSTRAINT "provider_services_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderUserRole" ADD CONSTRAINT "ProviderUserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderUserRole" ADD CONSTRAINT "ProviderUserRole_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceLocation" ADD CONSTRAINT "ServiceLocation_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessHour" ADD CONSTRAINT "BusinessHour_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerProvider" ADD CONSTRAINT "WorkerProvider_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
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

