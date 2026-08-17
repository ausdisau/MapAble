/**
 * Synthetic Billing Centre demonstration data.
 * All claim submissions and external payments are SIMULATED.
 *
 * Usage: npx tsx prisma/seed-billing-centre.ts
 */
import {
  BillingCentreClaimGateway,
  BillingEvidenceStatus,
  BillingFundingSourceType,
  BillingInvoiceStatus,
  BillingServiceRecordSourceType,
  BillingServiceType,
  PricingPolicyStatus,
} from "@prisma/client";

import { prisma } from "../lib/prisma";

const SIM = "[SIMULATED]";

async function main() {
  console.log("Seeding Billing Centre demo data (simulated)...");

  const participant = await prisma.user.upsert({
    where: { email: "billing-demo-participant@mapable.local" },
    update: {},
    create: {
      email: "billing-demo-participant@mapable.local",
      name: "Billing Demo Participant",
      primaryRole: "participant",
      passwordHash: "unused",
    },
  });

  const providerAdmin = await prisma.user.upsert({
    where: { email: "billing-demo-provider@mapable.local" },
    update: {},
    create: {
      email: "billing-demo-provider@mapable.local",
      name: "Billing Demo Provider",
      primaryRole: "provider_admin",
      passwordHash: "unused",
    },
  });

  const org = await prisma.organisation.upsert({
    where: { id: "billing-demo-org-000000000001" },
    update: { name: "MapAble Billing Demo Care Org" },
    create: {
      id: "billing-demo-org-000000000001",
      name: "MapAble Billing Demo Care Org",
      organisationType: "care_provider",
      abn: "51824753556",
      contactEmail: "billing-demo-provider@mapable.local",
    },
  });

  await prisma.organisationMember.upsert({
    where: {
      userId_organisationId: {
        userId: providerAdmin.id,
        organisationId: org.id,
      },
    },
    update: {},
    create: {
      userId: providerAdmin.id,
      organisationId: org.id,
      role: "provider_admin",
    },
  });

  const policy = await prisma.pricingPolicy.upsert({
    where: { id: "billing-demo-policy-000000001" },
    update: {},
    create: {
      id: "billing-demo-policy-000000001",
      name: "NDIS Support Catalogue Demo AU",
      jurisdiction: "AU",
      sourceUrl: "https://www.ndis.gov.au/providers/pricing-arrangements",
      notes: `${SIM} Demo policy — not an official price list.`,
    },
  });

  const policyVersion = await prisma.pricingPolicyVersion.upsert({
    where: { policyId_version: { policyId: policy.id, version: "2026.1-demo" } },
    update: { status: PricingPolicyStatus.active },
    create: {
      policyId: policy.id,
      version: "2026.1-demo",
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      status: PricingPolicyStatus.active,
      verificationDate: new Date("2026-01-15T00:00:00.000Z"),
      sourceUrl: "https://www.ndis.gov.au/providers/pricing-arrangements",
      notes: `${SIM} Verified demo catalogue version.`,
    },
  });

  await prisma.pricingRule.deleteMany({
    where: { policyVersionId: policyVersion.id },
  });
  await prisma.pricingRule.createMany({
    data: [
      {
        policyVersionId: policyVersion.id,
        supportItemNumber: "01_011_0107_1_1",
        supportItemName: "Assistance with Self-Care Activities - Standard - Weekday Daytime",
        supportCategory: "Core",
        registrationGroup: "0107",
        unit: "hour",
        weekdayOrTimeBand: "weekday_daytime",
        priceCapCents: 6706,
        gstTreatment: "input_taxed",
        status: PricingPolicyStatus.active,
        requiredEvidence: { types: ["timesheet", "participant_confirmation"] },
      },
      {
        policyVersionId: policyVersion.id,
        supportItemNumber: "01_799_0107_1_1",
        supportItemName: "Provider travel — non-labour costs (demo)",
        supportCategory: "Core",
        registrationGroup: "0107",
        unit: "each",
        priceCapCents: 2500,
        gstTreatment: "input_taxed",
        status: PricingPolicyStatus.active,
      },
    ],
  });

  const funding = await prisma.billingFundingSource.create({
    data: {
      userId: participant.id,
      type: BillingFundingSourceType.ndis_plan_managed,
      label: "Demo plan manager",
      ndisParticipantNumber: "DEMO0001",
      planManagerName: "Demo Plan Manager",
      planManagerEmail: "pm@example.com",
      isDefault: true,
      metadata: { simulated: true },
    },
  });

  // 1. Care shift → invoice
  const careRecord = await upsertServiceRecord({
    participantId: participant.id,
    organisationId: org.id,
    sourceType: "care_shift",
    sourceId: "demo-care-shift-1",
    serviceType: "care",
    supportItemCode: "01_011_0107_1_1",
    estimatedCents: 13412,
    notes: `${SIM} Completed care shift becoming an invoice.`,
  });

  const careInvoice = await createDemoInvoice({
    userId: participant.id,
    providerId: org.id,
    fundingSourceId: funding.id,
    serviceType: "care",
    status: "participant_review",
    invoiceNumber: "MAP-DEMO-0001",
    totalCents: 13412,
    subtotalCents: 13412,
    lines: [
      {
        description: "Assistance with self-care — weekday daytime",
        quantity: 2,
        unitAmountCents: 6706,
        totalCents: 13412,
        ndisLineItem: "01_011_0107_1_1",
        serviceRecordId: careRecord.id,
        policyVersionId: policyVersion.id,
        evidenceStatus: "approved",
      },
    ],
    serviceRecordIds: [careRecord.id],
  });

  // 2. Care + travel
  const travelRecord = await upsertServiceRecord({
    participantId: participant.id,
    organisationId: org.id,
    sourceType: "travel_cost",
    sourceId: "demo-care-travel-1",
    serviceType: "care",
    supportItemCode: "01_799_0107_1_1",
    estimatedCents: 1800,
    notes: `${SIM} Approved provider travel.`,
  });
  await createDemoInvoice({
    userId: participant.id,
    providerId: org.id,
    fundingSourceId: funding.id,
    serviceType: "care",
    status: "ready_to_issue",
    invoiceNumber: "MAP-DEMO-0002",
    totalCents: 15212,
    subtotalCents: 15212,
    lines: [
      {
        description: "Assistance with self-care",
        quantity: 2,
        unitAmountCents: 6706,
        totalCents: 13412,
        ndisLineItem: "01_011_0107_1_1",
        policyVersionId: policyVersion.id,
        evidenceStatus: "approved",
      },
      {
        description: "Approved provider travel (non-labour)",
        quantity: 1,
        unitAmountCents: 1800,
        totalCents: 1800,
        ndisLineItem: "01_799_0107_1_1",
        serviceRecordId: travelRecord.id,
        policyVersionId: policyVersion.id,
        evidenceStatus: "approved",
      },
    ],
    serviceRecordIds: [travelRecord.id],
  });

  // 3. Transport with co-payment
  const privateFunding = await prisma.billingFundingSource.create({
    data: {
      userId: participant.id,
      type: BillingFundingSourceType.mixed,
      label: "Mixed NDIS + private co-pay",
      metadata: { simulated: true },
    },
  });
  const tripRecord = await upsertServiceRecord({
    participantId: participant.id,
    organisationId: org.id,
    sourceType: "transport_trip",
    sourceId: "demo-trip-1",
    serviceType: "transport",
    estimatedCents: 8500,
    notes: `${SIM} Transport booking with participant co-payment.`,
  });
  await createDemoInvoice({
    userId: participant.id,
    providerId: org.id,
    fundingSourceId: privateFunding.id,
    fundingSourceType: "mixed",
    serviceType: "transport",
    status: "issued",
    invoiceNumber: "MAP-DEMO-0003",
    subtotalCents: 7000,
    coPaymentCents: 1500,
    totalCents: 8500,
    lines: [
      {
        description: "Accessible transport trip — base + time",
        quantity: 1,
        unitAmountCents: 7000,
        totalCents: 7000,
        fundedCents: 7000,
        coPaymentCents: 0,
        serviceRecordId: tripRecord.id,
        evidenceStatus: "approved",
      },
      {
        description: "Participant co-payment",
        quantity: 1,
        unitAmountCents: 1500,
        totalCents: 1500,
        coPaymentCents: 1500,
        privateCents: 1500,
        evidenceStatus: "approved",
      },
    ],
    serviceRecordIds: [tripRecord.id],
  });

  // 4. Foods split
  const foodsRecord = await upsertServiceRecord({
    participantId: participant.id,
    organisationId: org.id,
    sourceType: "foods_order",
    sourceId: "demo-foods-1",
    serviceType: "foods",
    estimatedCents: 6400,
    notes: `${SIM} Foods order split: funded preparation + private ingredients.`,
  });
  await createDemoInvoice({
    userId: participant.id,
    providerId: org.id,
    fundingSourceId: privateFunding.id,
    fundingSourceType: "mixed",
    serviceType: "foods",
    status: "draft",
    invoiceNumber: "MAP-DEMO-0004",
    subtotalCents: 6400,
    totalCents: 6400,
    lines: [
      {
        description: "Meal preparation (funded support)",
        quantity: 1,
        unitAmountCents: 4200,
        totalCents: 4200,
        fundedCents: 4200,
        serviceRecordId: foodsRecord.id,
        evidenceStatus: "submitted",
      },
      {
        description: "Ingredients (private pay)",
        quantity: 1,
        unitAmountCents: 2200,
        totalCents: 2200,
        privateCents: 2200,
        evidenceStatus: "submitted",
      },
    ],
    serviceRecordIds: [foodsRecord.id],
  });

  // 5. Plan-managed export
  await createDemoInvoice({
    userId: participant.id,
    providerId: org.id,
    fundingSourceId: funding.id,
    serviceType: "care",
    status: "exported",
    invoiceNumber: "MAP-DEMO-0005",
    subtotalCents: 6706,
    totalCents: 6706,
    planManagerExportStatus: `${SIM} exported`,
    lines: [
      {
        description: "Plan-managed support — exported pack",
        quantity: 1,
        unitAmountCents: 6706,
        totalCents: 6706,
        ndisLineItem: "01_011_0107_1_1",
        policyVersionId: policyVersion.id,
        evidenceStatus: "approved",
      },
    ],
  });

  // 6. Self-managed reimbursement pack (funding)
  await prisma.billingFundingSource.create({
    data: {
      userId: participant.id,
      type: BillingFundingSourceType.ndis_self_managed,
      label: "Self-managed demo",
      metadata: { simulated: true, pack: "reimbursement" },
    },
  });

  // 7. Policy validation failure invoice
  await createDemoInvoice({
    userId: participant.id,
    providerId: org.id,
    fundingSourceId: funding.id,
    serviceType: "care",
    status: "policy_review_required",
    invoiceNumber: "MAP-DEMO-0007",
    subtotalCents: 20000,
    totalCents: 20000,
    anomalyFlags: { reason: "rate_above_cap", simulated: true },
    lines: [
      {
        description: "Support charged above verified cap",
        quantity: 1,
        unitAmountCents: 20000,
        totalCents: 20000,
        ndisLineItem: "01_011_0107_1_1",
        validationStatus: "POLICY_REVIEW_REQUIRED",
        evidenceStatus: "submitted",
      },
    ],
  });

  // 8. Duplicate timesheet safeguard
  await prisma.billingSafeguardAlert.create({
    data: {
      organisationId: org.id,
      entityType: "BillingServiceRecord",
      entityId: careRecord.id,
      ruleCode: "duplicate_timesheet",
      severity: "review_required",
      message: `${SIM} Review required: overlapping timesheet windows detected for the same worker.`,
      metadata: { simulated: true },
    },
  });

  // 9. Disputed invoice → credit note
  const disputed = await createDemoInvoice({
    userId: participant.id,
    providerId: org.id,
    fundingSourceId: funding.id,
    serviceType: "care",
    status: "disputed",
    invoiceNumber: "MAP-DEMO-0009",
    subtotalCents: 6706,
    totalCents: 6706,
    disputedAt: new Date(),
    disputeReason: `${SIM} Participant questioned travel line.`,
    lines: [
      {
        description: "Support session under question",
        quantity: 1,
        unitAmountCents: 6706,
        totalCents: 6706,
        evidenceStatus: "approved",
      },
    ],
  });
  const dispute = await prisma.billingDispute.create({
    data: {
      invoiceId: disputed.id,
      participantId: participant.id,
      status: "resolved_credit",
      scope: "line",
      summary: `${SIM} Questioned a single line; resolved with credit note.`,
      preferredContact: "email",
      outcomeReason: "Credit issued for travel line after review.",
      amountOnHoldCents: 0,
      resolvedAt: new Date(),
    },
  });
  await prisma.billingDisputeMessage.create({
    data: {
      disputeId: dispute.id,
      authorId: participant.id,
      body: "I was not charged for travel in our agreement.",
      isInternal: false,
    },
  });
  await prisma.billingCreditNote.create({
    data: {
      invoiceId: disputed.id,
      creditNoteNumber: "CN-DEMO-0009",
      status: "issued",
      amountCents: 1800,
      reason: `${SIM} Credit for unsupported travel charge.`,
      issuedAt: new Date(),
      createdById: providerAdmin.id,
    },
  });

  // 10. Stripe payment reconciled (simulated)
  const paidInvoice = await createDemoInvoice({
    userId: participant.id,
    providerId: org.id,
    fundingSourceId: privateFunding.id,
    fundingSourceType: "private_pay",
    serviceType: "care",
    status: "paid",
    invoiceNumber: "MAP-DEMO-0010",
    subtotalCents: 5000,
    totalCents: 5000,
    amountPaidCents: 5000,
    paidAt: new Date(),
    lines: [
      {
        description: "Private-pay support session",
        quantity: 1,
        unitAmountCents: 5000,
        totalCents: 5000,
        privateCents: 5000,
        evidenceStatus: "approved",
      },
    ],
  });
  await prisma.billingPayment.create({
    data: {
      invoiceId: paidInvoice.id,
      userId: participant.id,
      providerId: org.id,
      status: "succeeded",
      method: "stripe_checkout",
      amountCents: 5000,
      paidAt: new Date(),
      stripePaymentIntentId: `pi_simulated_${paidInvoice.id.slice(0, 8)}`,
    },
  });

  // 11. Plan-manager remittance partial
  const recon = await prisma.billingReconciliationSession.create({
    data: {
      organisationId: org.id,
      source: "plan_manager_remittance",
      status: "open",
      notes: `${SIM} Partial remittance across several invoices.`,
      createdById: providerAdmin.id,
    },
  });
  await prisma.billingReconciliationMatch.createMany({
    data: [
      {
        sessionId: recon.id,
        invoiceId: careInvoice.id,
        amountCents: 5000,
        confidenceBps: 8500,
        reasons: ["invoice_number", "amount", "date_proximity"],
        status: "suggested",
        notes: `${SIM} Suggested match`,
      },
      {
        sessionId: recon.id,
        invoiceId: paidInvoice.id,
        amountCents: 5000,
        confidenceBps: 9200,
        reasons: ["invoice_number", "amount", "payer"],
        status: "confirmed",
        notes: `${SIM} Confirmed Stripe reconciliation`,
        confirmedById: providerAdmin.id,
      },
    ],
  });

  // 12. Provider payout + remittance
  await prisma.billingCentreProviderPayout.create({
    data: {
      organisationId: org.id,
      status: "approved",
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-07-15"),
      grossCents: 20000,
      commissionCents: 2000,
      adjustmentsCents: 0,
      withheldCents: 0,
      netPayableCents: 18000,
      remittanceJson: {
        simulated: true,
        lines: [{ invoiceNumber: "MAP-DEMO-0010", amountCents: 5000 }],
      },
      destinationRef: "stripe_connect_simulated",
      approvedById: providerAdmin.id,
    },
  });

  // 13. Xero sync failure + retry
  await prisma.billingIntegrationConnection.upsert({
    where: {
      organisationId_provider: {
        organisationId: org.id,
        provider: "xero",
      },
    },
    update: {
      status: "error",
      lastError: `${SIM} Token refresh failed — queued for retry.`,
      lastSyncAt: new Date(),
    },
    create: {
      organisationId: org.id,
      provider: "xero",
      status: "error",
      lastError: `${SIM} Token refresh failed — queued for retry.`,
      configJson: { simulated: true, retryQueue: true },
    },
  });

  // 14. Provider subscription renewal
  const billingAccount = await prisma.billingAccount.upsert({
    where: {
      userId_role: { userId: providerAdmin.id, role: "provider" },
    },
    update: {},
    create: {
      userId: providerAdmin.id,
      role: "provider",
      stripeCustomerId: "cus_simulated_provider_demo",
    },
  });
  await prisma.billingSubscription.create({
    data: {
      userId: providerAdmin.id,
      billingAccountId: billingAccount.id,
      planCode: "provider_pro",
      status: "active",
      stripeCustomerId: "cus_simulated_provider_demo",
      stripeSubscriptionId: `sub_simulated_${Date.now()}`,
      stripePriceId: "price_simulated_provider_pro",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    },
  });

  // Claim batch (simulated)
  const batch = await prisma.billingClaimBatch.create({
    data: {
      organisationId: org.id,
      gateway: BillingCentreClaimGateway.mock,
      status: "EXPORTED",
      simulated: true,
      externalReference: "MOCK-DEMO-BATCH",
      createdById: providerAdmin.id,
      items: {
        create: {
          invoiceId: careInvoice.id,
          supportItemCode: "01_011_0107_1_1",
          amountCents: 13412,
          status: "EXPORTED",
        },
      },
    },
  });

  console.log("Billing Centre seed complete.");
  console.log({
    participant: participant.email,
    org: org.name,
    policyVersion: policyVersion.version,
    claimBatch: batch.id,
    note: "All claims/payments/Xero events are SIMULATED.",
  });
}

async function upsertServiceRecord(input: {
  participantId: string;
  organisationId: string;
  sourceType: BillingServiceRecordSourceType;
  sourceId: string;
  serviceType: BillingServiceType;
  supportItemCode?: string;
  estimatedCents: number;
  notes: string;
}) {
  return prisma.billingServiceRecord.upsert({
    where: {
      sourceType_sourceId: {
        sourceType: input.sourceType,
        sourceId: input.sourceId,
      },
    },
    update: {
      status: "locked",
      lockedAt: new Date(),
      estimatedCents: input.estimatedCents,
      notesForBilling: input.notes,
    },
    create: {
      participantId: input.participantId,
      organisationId: input.organisationId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      serviceType: input.serviceType,
      status: "locked",
      serviceStart: new Date("2026-07-10T01:00:00.000Z"),
      serviceEnd: new Date("2026-07-10T03:00:00.000Z"),
      quantity: 2,
      unit: "hour",
      supportItemCode: input.supportItemCode,
      estimatedCents: input.estimatedCents,
      lockedAt: new Date(),
      notesForBilling: input.notes,
      evidence: {
        create: {
          evidenceType: "completion",
          status: BillingEvidenceStatus.approved,
          summary: input.notes,
        },
      },
    },
  });
}

async function createDemoInvoice(input: {
  userId: string;
  providerId: string;
  fundingSourceId?: string;
  fundingSourceType?: BillingFundingSourceType;
  serviceType: BillingServiceType;
  status: BillingInvoiceStatus;
  invoiceNumber: string;
  subtotalCents: number;
  totalCents: number;
  platformFeeCents?: number;
  gstCents?: number;
  coPaymentCents?: number;
  amountPaidCents?: number;
  paidAt?: Date;
  disputedAt?: Date;
  disputeReason?: string;
  planManagerExportStatus?: string;
  anomalyFlags?: object;
  serviceRecordIds?: string[];
  lines: {
    description: string;
    quantity: number;
    unitAmountCents: number;
    totalCents: number;
    ndisLineItem?: string;
    serviceRecordId?: string;
    policyVersionId?: string;
    evidenceStatus?: BillingEvidenceStatus;
    validationStatus?: string;
    fundedCents?: number;
    coPaymentCents?: number;
    privateCents?: number;
  }[];
}) {
  const existing = await prisma.billingInvoice.findUnique({
    where: { invoiceNumber: input.invoiceNumber },
  });
  if (existing) {
    await prisma.billingInvoiceLineItem.deleteMany({
      where: { invoiceId: existing.id },
    });
    await prisma.billingInvoice.delete({ where: { id: existing.id } });
  }

  const invoice = await prisma.billingInvoice.create({
    data: {
      userId: input.userId,
      providerId: input.providerId,
      fundingSourceId: input.fundingSourceId,
      fundingSourceType: input.fundingSourceType,
      serviceType: input.serviceType,
      status: input.status,
      invoiceNumber: input.invoiceNumber,
      currency: "AUD",
      subtotalCents: input.subtotalCents,
      platformFeeCents: input.platformFeeCents ?? 0,
      gstCents: input.gstCents ?? 0,
      coPaymentCents: input.coPaymentCents ?? 0,
      totalCents: input.totalCents,
      amountPaidCents: input.amountPaidCents ?? 0,
      paidAt: input.paidAt,
      disputedAt: input.disputedAt,
      disputeReason: input.disputeReason,
      planManagerExportStatus: input.planManagerExportStatus,
      anomalyFlags: input.anomalyFlags,
      issuedAt:
        input.status === "draft" || input.status === "policy_review_required"
          ? null
          : new Date(),
      lineItems: {
        create: input.lines.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitAmountCents: li.unitAmountCents,
          totalCents: li.totalCents,
          ndisLineItem: li.ndisLineItem,
          serviceRecordId: li.serviceRecordId,
          policyVersionId: li.policyVersionId,
          evidenceStatus: li.evidenceStatus ?? "missing",
          validationStatus: li.validationStatus,
          fundedCents: li.fundedCents ?? 0,
          coPaymentCents: li.coPaymentCents ?? 0,
          privateCents: li.privateCents ?? 0,
          gstApplicable: false,
        })),
      },
    },
  });

  if (input.serviceRecordIds?.length) {
    await prisma.billingServiceRecord.updateMany({
      where: { id: { in: input.serviceRecordIds } },
      data: { invoiceId: invoice.id, status: "invoiced" },
    });
  }

  return invoice;
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
