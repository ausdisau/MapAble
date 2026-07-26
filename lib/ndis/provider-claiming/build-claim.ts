import { decryptNdisNumber, maskNdisNumber } from "@/lib/crypto/ndis";
import type { NdiaProviderClaimPayload } from "@/lib/ndis/provider-claiming/types";
import { prisma } from "@/lib/prisma";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function participantNdis(participantId: string) {
  const profile = await prisma.participantProfile.findUnique({
    where: { userId: participantId },
  });
  if (!profile?.ndisParticipantNumberEnc) {
    return { ndisNumber: null, masked: null };
  }
  const ndisNumber = decryptNdisNumber(profile.ndisParticipantNumberEnc);
  return {
    ndisNumber,
    masked: ndisNumber ? maskNdisNumber(ndisNumber) : null,
  };
}

export async function buildClaimFromLegacyInvoice(
  invoiceId: string,
  organisationId: string
) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organisationId },
    include: {
      lines: true,
      organisation: true,
      fundingSource: true,
      participant: { include: { participantProfile: true } },
    },
  });
  if (!invoice) return { ok: false as const, error: "Invoice not found" };

  const org = invoice.organisation;
  if (!org) return { ok: false as const, error: "Organisation required" };

  const { ndisNumber, masked } = await participantNdis(invoice.participantId);

  const lines = invoice.lines.length
    ? invoice.lines
    : [
        {
          description: "Service",
          serviceDate: invoice.issueDate ?? invoice.createdAt,
          quantity: 1,
          unitAmountCents: invoice.totalCents,
          totalAmountCents: invoice.totalCents,
          supportItemCode: null,
        },
      ];

  const serviceDates = lines.map((l) => l.serviceDate);
  const start = new Date(Math.min(...serviceDates.map((d) => d.getTime())));
  const end = new Date(Math.max(...serviceDates.map((d) => d.getTime())));

  const payload: NdiaProviderClaimPayload = {
    claimType: "registered_provider",
    provider: {
      abn: org.abn,
      ndisRegistrationNumber: org.ndisRegistrationNumber ?? "",
      organisationId: org.id,
      name: org.name,
    },
    participant: {
      ndisNumber,
      ndisNumberMasked: masked,
      mapableUserId: invoice.participantId,
    },
    invoiceReference: {
      mapableLegacyInvoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
    },
    servicePeriod: { start: isoDate(start), end: isoDate(end) },
    lines: lines.map((line, i) => ({
      lineNumber: i + 1,
      supportItemCode: line.supportItemCode ?? "",
      description: line.description,
      serviceDate: isoDate(line.serviceDate),
      quantity: Number(line.quantity),
      unitPriceCents: line.unitAmountCents,
      totalCents: line.totalAmountCents,
      gstIncluded: false,
    })),
    totals: {
      subtotalCents: invoice.subtotalCents,
      taxCents: invoice.taxCents,
      totalCents: invoice.totalCents,
      currency: invoice.currency,
    },
    metadata: {
      builtAt: new Date().toISOString(),
      mapableVersion: "1",
    },
  };

  return {
    ok: true as const,
    payload,
    fundingType: invoice.fundingSource?.type,
    participantId: invoice.participantId,
    organisationId: org.id,
  };
}

export async function buildClaimFromBillingInvoice(
  billingInvoiceId: string,
  organisationId: string
) {
  const invoice = await prisma.billingInvoice.findFirst({
    where: { id: billingInvoiceId, providerId: organisationId },
    include: {
      lineItems: true,
      fundingSource: true,
    },
  });
  if (!invoice) return { ok: false as const, error: "Billing invoice not found" };

  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
  });
  if (!org) return { ok: false as const, error: "Organisation not found" };

  const { ndisNumber, masked } = await participantNdis(invoice.userId);

  const payload: NdiaProviderClaimPayload = {
    claimType: "registered_provider",
    provider: {
      abn: org.abn,
      ndisRegistrationNumber: org.ndisRegistrationNumber ?? "",
      organisationId: org.id,
      name: org.name,
    },
    participant: {
      ndisNumber,
      ndisNumberMasked: masked,
      mapableUserId: invoice.userId,
    },
    invoiceReference: {
      mapableBillingInvoiceId: invoice.id,
    },
    servicePeriod: {
      start: isoDate(invoice.createdAt),
      end: isoDate(invoice.dueAt ?? invoice.createdAt),
    },
    lines: invoice.lineItems.map((line, i) => ({
      lineNumber: i + 1,
      supportItemCode: line.ndisLineItem ?? "",
      description: line.description,
      serviceDate: isoDate(line.createdAt),
      quantity: Number(line.quantity),
      unitPriceCents: line.unitAmountCents,
      totalCents: line.totalCents,
      gstIncluded: line.gstApplicable,
    })),
    totals: {
      subtotalCents: invoice.subtotalCents,
      taxCents: invoice.gstCents,
      totalCents: invoice.totalCents,
      currency: invoice.currency,
    },
    metadata: {
      builtAt: new Date().toISOString(),
      mapableVersion: "1",
    },
  };

  return {
    ok: true as const,
    payload,
    fundingType: invoice.fundingSource?.type as string | undefined,
    participantId: invoice.userId,
    organisationId: org.id,
  };
}
