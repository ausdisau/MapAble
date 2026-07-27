CREATE TABLE "life_twin_domain_records" (
  "id" TEXT NOT NULL,
  "lifeTwinId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "source" TEXT NOT NULL,
  "verificationStatus" TEXT NOT NULL,
  "consentScopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "version" INTEGER NOT NULL DEFAULT 1,
  "supersedesRecordId" TEXT,
  "expiresAt" TIMESTAMP(3),
  "disputedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "life_twin_domain_records_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "life_twin_domain_records_participantId_domain_deletedAt_idx"
  ON "life_twin_domain_records"("participantId", "domain", "deletedAt");
CREATE INDEX "life_twin_domain_records_lifeTwinId_domain_version_idx"
  ON "life_twin_domain_records"("lifeTwinId", "domain", "version");
ALTER TABLE "life_twin_domain_records"
  ADD CONSTRAINT "life_twin_domain_records_lifeTwinId_fkey"
  FOREIGN KEY ("lifeTwinId") REFERENCES "participant_life_twins"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
