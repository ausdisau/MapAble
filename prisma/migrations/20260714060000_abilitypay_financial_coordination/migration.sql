CREATE TABLE "expected_cost_contexts" (
  "id" TEXT NOT NULL, "participantId" TEXT NOT NULL, "missionId" TEXT,
  "serviceAgreementId" TEXT NOT NULL, "bookingId" TEXT, "providerOrganisationId" TEXT NOT NULL,
  "supportItemCode" TEXT, "supportDescription" TEXT NOT NULL, "expectedQuantity" DECIMAL(65,30),
  "expectedUnit" TEXT, "expectedUnitPriceCents" INTEGER, "expectedTotalCents" INTEGER,
  "travelTerms" JSONB, "cancellationTerms" JSONB, "fundingCategory" TEXT,
  "evidenceSourceIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "validFrom" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "expected_cost_contexts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "expected_cost_contexts_participantId_providerOrganisationId_validUntil_idx"
  ON "expected_cost_contexts"("participantId","providerOrganisationId","validUntil");
CREATE INDEX "expected_cost_contexts_missionId_idx" ON "expected_cost_contexts"("missionId");
CREATE INDEX "expected_cost_contexts_bookingId_idx" ON "expected_cost_contexts"("bookingId");
ALTER TABLE "expected_cost_contexts" ADD CONSTRAINT "expected_cost_contexts_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "invoice_reconciliation_records" (
  "id" TEXT NOT NULL, "invoiceId" TEXT NOT NULL, "expectedCostContextId" TEXT,
  "overallStatus" TEXT NOT NULL, "lineResults" JSONB NOT NULL, "duplicateIndicators" JSONB NOT NULL,
  "differences" JSONB NOT NULL, "missingEvidence" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "uncertainty" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "policyVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invoice_reconciliation_records_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "invoice_reconciliation_records_invoiceId_createdAt_idx"
  ON "invoice_reconciliation_records"("invoiceId","createdAt");
CREATE INDEX "invoice_reconciliation_records_expectedCostContextId_idx"
  ON "invoice_reconciliation_records"("expectedCostContextId");
ALTER TABLE "invoice_reconciliation_records" ADD CONSTRAINT "invoice_reconciliation_records_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "BillingInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "participant_invoice_decisions" (
  "id" TEXT NOT NULL, "invoiceId" TEXT NOT NULL, "participantId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL, "decision" TEXT NOT NULL, "reason" TEXT,
  "authorityGrantId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "participant_invoice_decisions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "participant_invoice_decisions_participantId_createdAt_idx"
  ON "participant_invoice_decisions"("participantId","createdAt");
CREATE INDEX "participant_invoice_decisions_invoiceId_createdAt_idx"
  ON "participant_invoice_decisions"("invoiceId","createdAt");
ALTER TABLE "participant_invoice_decisions" ADD CONSTRAINT "participant_invoice_decisions_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "BillingInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "pricing_rule_sets" (
  "id" TEXT NOT NULL, "jurisdiction" TEXT NOT NULL, "scheme" TEXT NOT NULL,
  "version" TEXT NOT NULL, "effectiveFrom" TIMESTAMP(3) NOT NULL, "effectiveTo" TIMESTAMP(3),
  "sourceReference" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'draft', "rulesJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pricing_rule_sets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pricing_rule_sets_jurisdiction_scheme_version_key"
  ON "pricing_rule_sets"("jurisdiction","scheme","version");
CREATE INDEX "pricing_rule_sets_jurisdiction_scheme_status_effectiveFrom_idx"
  ON "pricing_rule_sets"("jurisdiction","scheme","status","effectiveFrom");
