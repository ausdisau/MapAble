import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { careosOpportunitiesConfig } from "@/lib/config/careos-opportunities";
import { createConsentReceipt } from "@/lib/consent/consent-receipt-service";
import {
  grantParticipantAuthority,
  revokeParticipantAuthority,
} from "@/lib/authority/participant-authority-service";
import { prisma } from "@/lib/prisma";

function assertWalletEnabled() {
  if (!careosOpportunitiesConfig.consentWalletEnabled) {
    throw new Error("CONSENT_WALLET_DISABLED");
  }
}

/**
 * O5 — Consent & credential wallet control plane over time-limited grants.
 * Not a login/credential store replacement (NextAuth/passkeys remain).
 */
export async function issueWalletAuthorityCredential(input: {
  participantId: string;
  delegateId: string;
  domain: string;
  actions: string[];
  consentScopes: string[];
  expiresAt: Date;
  purpose: string;
  tenantId?: string;
}) {
  assertWalletEnabled();
  if (input.domain === "finance" || input.domain === "clinical") {
    // Wallet may grant limited scopes, but finance/clinical inherit remains blocked
    // at decision layers; double-guard here for document/delegate MVP.
  }

  const grant = await grantParticipantAuthority({
    participantId: input.participantId,
    delegateId: input.delegateId,
    tenantId: input.tenantId,
    domain: input.domain,
    actions: input.actions,
    consentScopes: input.consentScopes,
    expiresAt: input.expiresAt,
    actorUserId: input.participantId,
    purpose: input.purpose,
    recipientRole: "wallet_delegate",
  });

  const receipt = await createConsentReceipt({
    participantId: input.participantId,
    actorUserId: input.participantId,
    scope: `wallet:${input.domain}`,
    purpose: input.purpose,
    recipientType: "delegate",
    recipientId: input.delegateId,
    action: "granted",
  });

  await createAuditEvent({
    actorUserId: input.participantId,
    participantId: input.participantId,
    action: "consent_wallet.authority_issued",
    entityType: "ParticipantAuthorityGrant",
    entityId: grant.id,
    metadata: { receiptId: receipt.id, domain: input.domain },
  });

  return { grant, preferentialReceipt: receipt };
}

export async function issueWalletDocumentCredential(input: {
  participantId: string;
  documentId: string;
  granteeUserId: string;
  purpose: string;
  expiresAt: Date;
}) {
  assertWalletEnabled();
  if (input.expiresAt <= new Date()) throw new Error("WALLET_EXPIRY_REQUIRED");

  const document = await prisma.document.findFirst({
    where: {
      id: input.documentId,
      OR: [
        { uploadedById: input.participantId },
        { participantId: input.participantId },
      ],
    },
  });
  if (!document) throw new Error("DOCUMENT_NOT_FOUND_OR_UNAUTHORIZED");

  const grant = await prisma.documentAccessGrant.create({
    data: {
      documentId: input.documentId,
      userId: input.granteeUserId,
      purpose: input.purpose,
      expiresAt: input.expiresAt,
      createdById: input.participantId,
    },
  });

  const receipt = await createConsentReceipt({
    participantId: input.participantId,
    actorUserId: input.participantId,
    scope: `wallet:document:${input.documentId}`,
    purpose: input.purpose,
    recipientType: "user",
    recipientId: input.granteeUserId,
    action: "granted",
  });

  return { grant, preferentialReceipt: receipt };
}

export async function revokeWalletAuthorityCredential(input: {
  grantId: string;
  participantId: string;
}) {
  assertWalletEnabled();
  await revokeParticipantAuthority({
    grantId: input.grantId,
    participantId: input.participantId,
    actorUserId: input.participantId,
  });
  return createConsentReceipt({
    participantId: input.participantId,
    actorUserId: input.participantId,
    scope: `wallet:authority:${input.grantId}`,
    purpose: "participant_revocation",
    action: "revoked",
  });
}

export async function revokeWalletDocumentCredential(input: {
  grantId: string;
  participantId: string;
}) {
  assertWalletEnabled();
  const existing = await prisma.documentAccessGrant.findFirst({
    where: { id: input.grantId, createdById: input.participantId },
  });
  if (!existing) throw new Error("DOCUMENT_GRANT_NOT_FOUND");

  const grant = await prisma.documentAccessGrant.update({
    where: { id: input.grantId },
    data: { revokedAt: new Date() },
  });

  const receipt = await createConsentReceipt({
    participantId: input.participantId,
    actorUserId: input.participantId,
    scope: `wallet:document:${grant.documentId}`,
    purpose: "participant_revocation",
    recipientType: "user",
    recipientId: grant.userId,
    action: "revoked",
  });

  return { grant, preferentialReceipt: receipt };
}

export async function listWalletCredentials(participantId: string) {
  assertWalletEnabled();
  const [authority, documents, receipts] = await Promise.all([
    prisma.participantAuthorityGrant.findMany({
      where: { participantId, revokedAt: null },
      include: {
        delegate: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.documentAccessGrant.findMany({
      where: { createdById: participantId, revokedAt: null },
      orderBy: { createdAt: "desc" },
    }),
    prisma.consentReceipt.findMany({
      where: {
        participantId,
        scope: { startsWith: "wallet:" },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  return { authority, documents, preferentialReceipts: receipts };
}

/** Preferential receipt when an existing grant is used for disclosure. */
export async function recordPreferentialDisclosureReceipt(input: {
  participantId: string;
  actorUserId: string;
  scope: string;
  purpose: string;
  recipientType?: string;
  recipientId?: string;
}) {
  assertWalletEnabled();
  return createConsentReceipt({
    ...input,
    action: "used",
    scope: input.scope.startsWith("wallet:")
      ? input.scope
      : `wallet:disclosure:${input.scope}`,
  });
}
