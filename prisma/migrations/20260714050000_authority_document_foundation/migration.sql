ALTER TABLE "Document"
  ADD COLUMN "tenantId" TEXT,
  ADD COLUMN "storageProvider" TEXT NOT NULL DEFAULT 'local',
  ADD COLUMN "storageVersion" TEXT,
  ADD COLUMN "classification" TEXT NOT NULL DEFAULT 'private',
  ADD COLUMN "expiresAt" TIMESTAMP(3);
CREATE INDEX "Document_tenantId_deletedAt_idx" ON "Document"("tenantId", "deletedAt");

CREATE TABLE "document_versions" (
  "id" TEXT NOT NULL, "documentId" TEXT NOT NULL, "version" INTEGER NOT NULL,
  "fileKey" TEXT NOT NULL, "storageVersion" TEXT, "mimeType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL, "scanStatus" "DocumentScanStatus" NOT NULL DEFAULT 'not_configured',
  "createdById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "document_versions_documentId_version_key" ON "document_versions"("documentId", "version");
CREATE INDEX "document_versions_documentId_createdAt_idx" ON "document_versions"("documentId", "createdAt");
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "document_access_grants" (
  "id" TEXT NOT NULL, "documentId" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "purpose" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "revokedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_access_grants_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "document_access_grants_documentId_userId_expiresAt_idx"
  ON "document_access_grants"("documentId", "userId", "expiresAt");
ALTER TABLE "document_access_grants" ADD CONSTRAINT "document_access_grants_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_access_grants" ADD CONSTRAINT "document_access_grants_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "participant_authority_grants" (
  "id" TEXT NOT NULL, "participantId" TEXT NOT NULL, "delegateId" TEXT NOT NULL,
  "tenantId" TEXT, "domain" TEXT NOT NULL, "actions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "consentScopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL, "revokedAt" TIMESTAMP(3), "revokedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "participant_authority_grants_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "participant_authority_grants_participantId_delegateId_domain_expiresAt_idx"
  ON "participant_authority_grants"("participantId", "delegateId", "domain", "expiresAt");
CREATE INDEX "participant_authority_grants_tenantId_revokedAt_idx"
  ON "participant_authority_grants"("tenantId", "revokedAt");
ALTER TABLE "participant_authority_grants" ADD CONSTRAINT "participant_authority_grants_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "participant_authority_grants" ADD CONSTRAINT "participant_authority_grants_delegateId_fkey"
  FOREIGN KEY ("delegateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
