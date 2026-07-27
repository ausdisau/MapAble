-- CreateEnum
CREATE TYPE "DelegateInvitationStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired', 'revoked');

-- CreateEnum
CREATE TYPE "EmergencyAccessStatus" AS ENUM ('requested', 'under_review', 'approved', 'denied', 'expired', 'revoked');

-- AlterTable
ALTER TABLE "participant_authority_grants" ADD COLUMN IF NOT EXISTS "purpose" TEXT;
ALTER TABLE "participant_authority_grants" ADD COLUMN IF NOT EXISTS "recipientRole" TEXT;
ALTER TABLE "participant_authority_grants" ADD COLUMN IF NOT EXISTS "evidenceRef" TEXT;
ALTER TABLE "participant_authority_grants" ADD COLUMN IF NOT EXISTS "decisionLimitJson" JSONB;

-- CreateTable
CREATE TABLE "mfa_enrolments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "enrolledAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mfa_enrolments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trusted_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceLabel" TEXT NOT NULL,
    "deviceFingerprintHash" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trusted_devices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_session_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,

    CONSTRAINT "auth_session_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "login_audit_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "emailHash" TEXT,
    "eventType" TEXT NOT NULL,
    "method" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "step_up_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "satisfiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "step_up_challenges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "authority_decisions" (
    "id" TEXT NOT NULL,
    "grantId" TEXT,
    "participantId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "purpose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "authority_decisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "consent_receipts" (
    "id" TEXT NOT NULL,
    "consentRecordId" TEXT,
    "participantId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "recipientType" TEXT,
    "recipientId" TEXT,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "delegate_invitations" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "inviteeEmail" TEXT NOT NULL,
    "inviteeUserId" TEXT,
    "roleType" TEXT NOT NULL,
    "proposedDomain" TEXT NOT NULL,
    "proposedActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "proposedConsentScopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "DelegateInvitationStatus" NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "resultingGrantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delegate_invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "emergency_access_requests" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "requestedScopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "EmergencyAccessStatus" NOT NULL DEFAULT 'requested',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_access_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "emergency_access_reviews" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_access_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mfa_enrolments_userId_method_key" ON "mfa_enrolments"("userId", "method");
CREATE INDEX "mfa_enrolments_userId_status_idx" ON "mfa_enrolments"("userId", "status");
CREATE INDEX "trusted_devices_userId_revokedAt_idx" ON "trusted_devices"("userId", "revokedAt");
CREATE UNIQUE INDEX "auth_session_records_sessionTokenHash_key" ON "auth_session_records"("sessionTokenHash");
CREATE INDEX "auth_session_records_userId_revokedAt_idx" ON "auth_session_records"("userId", "revokedAt");
CREATE INDEX "login_audit_events_userId_createdAt_idx" ON "login_audit_events"("userId", "createdAt");
CREATE INDEX "login_audit_events_eventType_createdAt_idx" ON "login_audit_events"("eventType", "createdAt");
CREATE INDEX "step_up_challenges_userId_status_expiresAt_idx" ON "step_up_challenges"("userId", "status", "expiresAt");
CREATE INDEX "authority_decisions_participantId_createdAt_idx" ON "authority_decisions"("participantId", "createdAt");
CREATE INDEX "authority_decisions_actorUserId_createdAt_idx" ON "authority_decisions"("actorUserId", "createdAt");
CREATE INDEX "consent_receipts_participantId_createdAt_idx" ON "consent_receipts"("participantId", "createdAt");
CREATE INDEX "delegate_invitations_participantId_status_idx" ON "delegate_invitations"("participantId", "status");
CREATE INDEX "delegate_invitations_inviteeEmail_status_idx" ON "delegate_invitations"("inviteeEmail", "status");
CREATE INDEX "emergency_access_requests_participantId_status_idx" ON "emergency_access_requests"("participantId", "status");
CREATE INDEX "emergency_access_requests_requesterId_status_idx" ON "emergency_access_requests"("requesterId", "status");
CREATE INDEX "emergency_access_reviews_requestId_idx" ON "emergency_access_reviews"("requestId");

ALTER TABLE "mfa_enrolments" ADD CONSTRAINT "mfa_enrolments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trusted_devices" ADD CONSTRAINT "trusted_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auth_session_records" ADD CONSTRAINT "auth_session_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "login_audit_events" ADD CONSTRAINT "login_audit_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "step_up_challenges" ADD CONSTRAINT "step_up_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "authority_decisions" ADD CONSTRAINT "authority_decisions_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "participant_authority_grants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "authority_decisions" ADD CONSTRAINT "authority_decisions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "authority_decisions" ADD CONSTRAINT "authority_decisions_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consent_receipts" ADD CONSTRAINT "consent_receipts_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consent_receipts" ADD CONSTRAINT "consent_receipts_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "delegate_invitations" ADD CONSTRAINT "delegate_invitations_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "delegate_invitations" ADD CONSTRAINT "delegate_invitations_inviteeUserId_fkey" FOREIGN KEY ("inviteeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "delegate_invitations" ADD CONSTRAINT "delegate_invitations_resultingGrantId_fkey" FOREIGN KEY ("resultingGrantId") REFERENCES "participant_authority_grants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "emergency_access_requests" ADD CONSTRAINT "emergency_access_requests_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "emergency_access_requests" ADD CONSTRAINT "emergency_access_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "emergency_access_reviews" ADD CONSTRAINT "emergency_access_reviews_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "emergency_access_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "emergency_access_reviews" ADD CONSTRAINT "emergency_access_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
