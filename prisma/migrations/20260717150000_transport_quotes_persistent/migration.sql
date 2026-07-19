-- CreateEnum
CREATE TYPE "TransportQuoteStatus" AS ENUM ('proposed', 'accepted', 'rejected', 'expired', 'amended', 'cancelled');

-- CreateTable
CREATE TABLE "transport_quotes" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "participantUserId" TEXT NOT NULL,
    "tripRequestId" TEXT,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "TransportQuoteStatus" NOT NULL DEFAULT 'proposed',
    "providerLabel" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_quote_versions" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "components" JSONB NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "vehicleAssumptions" JSONB NOT NULL DEFAULT '[]',
    "accessibilityAssumptions" JSONB NOT NULL DEFAULT '[]',
    "exclusions" JSONB NOT NULL DEFAULT '[]',
    "fundingDisclaimer" TEXT NOT NULL,
    "cancellationPolicy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_quote_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transport_quotes_organisationId_status_idx" ON "transport_quotes"("organisationId", "status");

-- CreateIndex
CREATE INDEX "transport_quotes_participantUserId_status_idx" ON "transport_quotes"("participantUserId", "status");

-- CreateIndex
CREATE INDEX "transport_quotes_tripRequestId_idx" ON "transport_quotes"("tripRequestId");

-- CreateIndex
CREATE INDEX "transport_quotes_expiresAt_idx" ON "transport_quotes"("expiresAt");

-- CreateIndex
CREATE INDEX "transport_quote_versions_quoteId_idx" ON "transport_quote_versions"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "transport_quote_versions_quoteId_version_key" ON "transport_quote_versions"("quoteId", "version");

-- AddForeignKey
ALTER TABLE "transport_quotes" ADD CONSTRAINT "transport_quotes_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_quotes" ADD CONSTRAINT "transport_quotes_participantUserId_fkey" FOREIGN KEY ("participantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_quotes" ADD CONSTRAINT "transport_quotes_tripRequestId_fkey" FOREIGN KEY ("tripRequestId") REFERENCES "transport_trip_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_quote_versions" ADD CONSTRAINT "transport_quote_versions_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "transport_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
