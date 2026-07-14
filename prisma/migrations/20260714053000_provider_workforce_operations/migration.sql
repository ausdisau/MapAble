CREATE TABLE "provider_service_offerings" (
  "id" TEXT NOT NULL, "organisationId" TEXT NOT NULL, "serviceType" TEXT NOT NULL,
  "registrationGroup" TEXT, "title" TEXT NOT NULL, "description" TEXT NOT NULL,
  "serviceAreas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "deliveryModes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "participantAgeGroups" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "accessibilityFeatures" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "supportCapabilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "communicationCapabilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "highIntensitySupported" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'active', "evidenceExpiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, "deletedAt" TIMESTAMP(3),
  CONSTRAINT "provider_service_offerings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "provider_service_offerings_organisationId_serviceType_status_idx"
  ON "provider_service_offerings"("organisationId", "serviceType", "status");
CREATE INDEX "provider_service_offerings_evidenceExpiresAt_idx"
  ON "provider_service_offerings"("evidenceExpiresAt");
ALTER TABLE "provider_service_offerings" ADD CONSTRAINT "provider_service_offerings_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CareShift"
  ADD COLUMN "missionId" TEXT,
  ADD COLUMN "workerAcceptanceStatus" TEXT NOT NULL DEFAULT 'not_offered',
  ADD COLUMN "continuityStatus" TEXT NOT NULL DEFAULT 'stable';
CREATE INDEX "CareShift_missionId_status_idx" ON "CareShift"("missionId", "status");

CREATE TABLE "shift_offers" (
  "id" TEXT NOT NULL, "careShiftId" TEXT NOT NULL, "workerProfileId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL, "missionId" TEXT, "status" TEXT NOT NULL DEFAULT 'awaiting_participant',
  "payloadHash" TEXT NOT NULL, "idempotencyKey" TEXT NOT NULL,
  "participantConfirmedAt" TIMESTAMP(3), "workerRespondedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "shift_offers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "shift_offers_idempotencyKey_key" ON "shift_offers"("idempotencyKey");
CREATE INDEX "shift_offers_careShiftId_status_idx" ON "shift_offers"("careShiftId", "status");
CREATE INDEX "shift_offers_workerProfileId_status_expiresAt_idx" ON "shift_offers"("workerProfileId", "status", "expiresAt");
CREATE INDEX "shift_offers_participantId_status_idx" ON "shift_offers"("participantId", "status");
CREATE INDEX "shift_offers_missionId_createdAt_idx" ON "shift_offers"("missionId", "createdAt");
ALTER TABLE "shift_offers" ADD CONSTRAINT "shift_offers_careShiftId_fkey"
  FOREIGN KEY ("careShiftId") REFERENCES "CareShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shift_offers" ADD CONSTRAINT "shift_offers_workerProfileId_fkey"
  FOREIGN KEY ("workerProfileId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shift_offers" ADD CONSTRAINT "shift_offers_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
