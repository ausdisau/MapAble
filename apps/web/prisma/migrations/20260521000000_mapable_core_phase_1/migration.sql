-- MapAble Core Phase 1

CREATE TYPE "PreferredContactMethod" AS ENUM ('email', 'phone', 'sms');
CREATE TYPE "MapAbleUserRole" AS ENUM ('participant', 'family_member', 'support_coordinator', 'support_worker', 'provider_admin', 'transport_operator', 'driver', 'employer', 'plan_manager', 'mapable_admin');
CREATE TYPE "OrganisationType" AS ENUM ('care_provider', 'transport_provider', 'plan_manager', 'support_coordination', 'employer', 'community_partner', 'mapable_internal');
CREATE TYPE "VerificationStatus" AS ENUM ('not_started', 'pending_review', 'verified', 'rejected', 'suspended');
CREATE TYPE "OrganisationStatus" AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE "ConsentScope" AS ENUM ('profile_read', 'accessibility_read', 'booking_read', 'booking_manage', 'messages_send', 'billing_read', 'support_coordination_access', 'plan_manager_invoice_access', 'transport_accessibility_share', 'care_accessibility_share');
CREATE TYPE "ConsentStatus" AS ENUM ('active', 'expired', 'revoked', 'pending');
CREATE TYPE "NotificationChannel" AS ENUM ('in_app', 'email', 'sms', 'push');
CREATE TYPE "NotificationCategory" AS ENUM ('booking', 'profile', 'consent', 'provider', 'billing', 'support', 'safeguarding', 'system');
CREATE TYPE "BookingType" AS ENUM ('care', 'transport', 'care_transport');
CREATE TYPE "BookingStatus" AS ENUM ('draft', 'requested', 'awaiting_provider_acceptance', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed');

ALTER TABLE "User" ADD COLUMN "phone" TEXT,
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Australia/Sydney',
ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en-AU',
ADD COLUMN "preferredContactMethod" "PreferredContactMethod" NOT NULL DEFAULT 'email',
ADD COLUMN "primaryRole" "MapAbleUserRole" NOT NULL DEFAULT 'participant',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable statements follow Prisma migration output pattern
CREATE TABLE "UserRoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MapAbleUserRole" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserRoleAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserRoleAssignment_userId_role_key" ON "UserRoleAssignment"("userId", "role");
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

CREATE UNIQUE INDEX "ParticipantProfile_userId_key" ON "ParticipantProfile"("userId");
ALTER TABLE "ParticipantProfile" ADD CONSTRAINT "ParticipantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

CREATE UNIQUE INDEX "AccessibilityProfile_userId_key" ON "AccessibilityProfile"("userId");
ALTER TABLE "AccessibilityProfile" ADD CONSTRAINT "AccessibilityProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

CREATE TABLE "OrganisationMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "role" "MapAbleUserRole" NOT NULL DEFAULT 'provider_admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrganisationMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganisationMember_userId_organisationId_key" ON "OrganisationMember"("userId", "organisationId");
ALTER TABLE "OrganisationMember" ADD CONSTRAINT "OrganisationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganisationMember" ADD CONSTRAINT "OrganisationMember_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

CREATE INDEX "ConsentRecord_subjectUserId_status_idx" ON "ConsentRecord"("subjectUserId", "status");
CREATE INDEX "ConsentRecord_grantedToOrganisationId_idx" ON "ConsentRecord"("grantedToOrganisationId");
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_grantedToUserId_fkey" FOREIGN KEY ("grantedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_grantedToOrganisationId_fkey" FOREIGN KEY ("grantedToOrganisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

CREATE UNIQUE INDEX "NotificationPreference_userId_category_channel_key" ON "NotificationPreference"("userId", "category", "channel");
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

CREATE INDEX "AuditEvent_action_idx" ON "AuditEvent"("action");
CREATE INDEX "AuditEvent_participantId_idx" ON "AuditEvent"("participantId");
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Booking_participantId_status_idx" ON "Booking"("participantId", "status");
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_assignedOrganisationId_fkey" FOREIGN KEY ("assignedOrganisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_assignedWorkerId_fkey" FOREIGN KEY ("assignedWorkerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_assignedDriverId_fkey" FOREIGN KEY ("assignedDriverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

ALTER TABLE "BookingSegment" ADD CONSTRAINT "BookingSegment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "FundingSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FundingSource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FundingSource_tag_key" ON "FundingSource"("tag");

CREATE TABLE "ProviderCredential" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "credentialType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProviderCredential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "registration" TEXT,
    "wheelchairAccessible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkerProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkerProfile_userId_key" ON "WorkerProfile"("userId");

CREATE TABLE "DriverProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DriverProfile_userId_key" ON "DriverProfile"("userId");
