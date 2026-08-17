-- Trust Fabric: purpose-bound participant access receipts, durable break-glass, decision notices

CREATE TABLE "participant_access_receipts" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "organisationId" TEXT,
    "purpose" TEXT NOT NULL,
    "fieldCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "authoritySource" TEXT NOT NULL,
    "authorityRef" TEXT,
    "consentRecordId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "correlationId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "challengedAt" TIMESTAMP(3),
    "challengeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participant_access_receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "break_glass_access_sessions" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "organisationId" TEXT,
    "participantId" TEXT,
    "fieldCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ticketRef" TEXT,
    "afterActionRequired" BOOLEAN NOT NULL DEFAULT true,
    "afterActionCompletedAt" TIMESTAMP(3),
    "afterActionNote" TEXT,
    "revokedAt" TIMESTAMP(3),
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "break_glass_access_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "decision_notice_records" (
    "id" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "responsibleSystem" TEXT NOT NULL,
    "reasonCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidenceRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unknowns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "humanOwnerUserId" TEXT,
    "participantId" TEXT,
    "organisationId" TEXT,
    "reviewPath" TEXT NOT NULL,
    "correctionPath" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_notice_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "participant_access_receipts_participantId_createdAt_idx" ON "participant_access_receipts"("participantId", "createdAt");
CREATE INDEX "participant_access_receipts_correlationId_idx" ON "participant_access_receipts"("correlationId");
CREATE INDEX "participant_access_receipts_actorUserId_createdAt_idx" ON "participant_access_receipts"("actorUserId", "createdAt");

CREATE INDEX "break_glass_access_sessions_adminUserId_expiresAt_idx" ON "break_glass_access_sessions"("adminUserId", "expiresAt");
CREATE INDEX "break_glass_access_sessions_participantId_idx" ON "break_glass_access_sessions"("participantId");
CREATE INDEX "break_glass_access_sessions_correlationId_idx" ON "break_glass_access_sessions"("correlationId");

CREATE INDEX "decision_notice_records_participantId_createdAt_idx" ON "decision_notice_records"("participantId", "createdAt");
CREATE INDEX "decision_notice_records_correlationId_idx" ON "decision_notice_records"("correlationId");

ALTER TABLE "participant_access_receipts" ADD CONSTRAINT "participant_access_receipts_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "participant_access_receipts" ADD CONSTRAINT "participant_access_receipts_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "participant_access_receipts" ADD CONSTRAINT "participant_access_receipts_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "break_glass_access_sessions" ADD CONSTRAINT "break_glass_access_sessions_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "decision_notice_records" ADD CONSTRAINT "decision_notice_records_humanOwnerUserId_fkey" FOREIGN KEY ("humanOwnerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
