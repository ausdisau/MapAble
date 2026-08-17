CREATE TABLE "provider_capability_evidence" (
  "id" TEXT NOT NULL, "organisationId" TEXT NOT NULL, "serviceType" TEXT NOT NULL,
  "geography" TEXT, "capability" TEXT NOT NULL, "communicationSupport" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "mobilityFeatures" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "assistanceAnimalSupported" BOOLEAN NOT NULL DEFAULT false,
  "source" TEXT NOT NULL, "verificationStatus" TEXT NOT NULL, "permittedPurposes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "expiresAt" TIMESTAMP(3), "revokedAt" TIMESTAMP(3),
  "disputedAt" TIMESTAMP(3), "evidenceSummary" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "provider_capability_evidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "provider_capability_evidence_organisationId_serviceType_verificationStatus_idx" ON "provider_capability_evidence"("organisationId","serviceType","verificationStatus");
CREATE INDEX "provider_capability_evidence_expiresAt_revokedAt_idx" ON "provider_capability_evidence"("expiresAt","revokedAt");
ALTER TABLE "provider_capability_evidence" ADD CONSTRAINT "provider_capability_evidence_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "worker_credential_evidence" (
  "id" TEXT NOT NULL, "workerProfileId" TEXT NOT NULL, "credentialType" TEXT NOT NULL, "jurisdiction" TEXT NOT NULL DEFAULT 'AU',
  "issuer" TEXT, "identifierMasked" TEXT, "verificationStatus" TEXT NOT NULL, "issuedAt" TIMESTAMP(3), "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3), "renewalRequiredAt" TIMESTAMP(3), "source" TEXT NOT NULL, "evidenceSummary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "worker_credential_evidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "worker_credential_evidence_workerProfileId_credentialType_verificationStatus_idx" ON "worker_credential_evidence"("workerProfileId","credentialType","verificationStatus");
CREATE INDEX "worker_credential_evidence_expiresAt_revokedAt_idx" ON "worker_credential_evidence"("expiresAt","revokedAt");
ALTER TABLE "worker_credential_evidence" ADD CONSTRAINT "worker_credential_evidence_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "worker_equipment_evidence" (
  "id" TEXT NOT NULL, "workerProfileId" TEXT NOT NULL, "equipmentType" TEXT NOT NULL,
  "compatibilityTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "verificationStatus" TEXT NOT NULL,
  "inspectedAt" TIMESTAMP(3), "maintenanceDueAt" TIMESTAMP(3), "expiresAt" TIMESTAMP(3), "revokedAt" TIMESTAMP(3),
  "source" TEXT NOT NULL, "evidenceSummary" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "worker_equipment_evidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "worker_equipment_evidence_workerProfileId_equipmentType_verificationStatus_idx" ON "worker_equipment_evidence"("workerProfileId","equipmentType","verificationStatus");
CREATE INDEX "worker_equipment_evidence_expiresAt_revokedAt_idx" ON "worker_equipment_evidence"("expiresAt","revokedAt");
ALTER TABLE "worker_equipment_evidence" ADD CONSTRAINT "worker_equipment_evidence_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
