import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import {
  CareAccessError,
  assertParticipantOwnsBooking,
  assertProviderOrgAccess,
} from "@/lib/care/access-control";
import { prisma } from "@/lib/prisma";

async function assertCanAccessBookingAgreement(
  actor: CurrentUser,
  booking: { participantId: string; organisationId: string },
): Promise<void> {
  if (isAdminRole(actor.primaryRole)) return;
  if (booking.participantId === actor.id) return;
  await assertProviderOrgAccess(actor, booking.organisationId);
}

export type AccessibleServiceAgreementView = {
  id: string;
  careBookingId: string;
  version: number;
  status: "placeholder" | "proposed" | "accepted" | "amended" | "expired";
  plainLanguageSummary: string;
  title: string;
  supportedDecisionMakingOffered: boolean;
  accessibleFormats: string[];
  acceptedAt?: string;
  acceptedByUserId?: string;
  expiresAt?: string;
};

function parseAgreementMeta(summary: string | null | undefined): {
  version: number;
  formats: string[];
  supportedDecisionMakingOffered: boolean;
  acceptedAt?: string;
  acceptedByUserId?: string;
  expiresAt?: string;
  status?: AccessibleServiceAgreementView["status"];
} {
  if (!summary) {
    return {
      version: 1,
      formats: ["plain_language"],
      supportedDecisionMakingOffered: true,
    };
  }
  try {
    const parsed = JSON.parse(summary) as Record<string, unknown>;
    if (parsed && typeof parsed === "object" && parsed.__mapableAgreement === true) {
      return {
        version: typeof parsed.version === "number" ? parsed.version : 1,
        formats: Array.isArray(parsed.formats)
          ? (parsed.formats as string[])
          : ["plain_language"],
        supportedDecisionMakingOffered:
          parsed.supportedDecisionMakingOffered !== false,
        acceptedAt:
          typeof parsed.acceptedAt === "string" ? parsed.acceptedAt : undefined,
        acceptedByUserId:
          typeof parsed.acceptedByUserId === "string"
            ? parsed.acceptedByUserId
            : undefined,
        expiresAt:
          typeof parsed.expiresAt === "string" ? parsed.expiresAt : undefined,
        status:
          typeof parsed.status === "string"
            ? (parsed.status as AccessibleServiceAgreementView["status"])
            : undefined,
      };
    }
  } catch {
    // plain text summary
  }
  return {
    version: 1,
    formats: ["plain_language"],
    supportedDecisionMakingOffered: true,
  };
}

export async function getOrCreateAccessibleServiceAgreement(
  careBookingId: string,
  actor: CurrentUser,
): Promise<AccessibleServiceAgreementView> {
  const booking = await prisma.careBooking.findUnique({
    where: { id: careBookingId },
    include: { serviceAgreement: true },
  });
  if (!booking) throw new Error("NOT_FOUND");
  try {
    await assertCanAccessBookingAgreement(actor, booking);
  } catch (e) {
    if (e instanceof CareAccessError) throw new Error("FORBIDDEN");
    throw e;
  }

  let agreement = booking.serviceAgreement;
  if (!agreement) {
    agreement = await prisma.careServiceAgreement.create({
      data: {
        careBookingId,
        placeholderTitle: "Accessible service agreement",
        placeholderSummary: JSON.stringify({
          __mapableAgreement: true,
          version: 1,
          status: "proposed",
          formats: ["plain_language", "large_text"],
          supportedDecisionMakingOffered: true,
          body:
            "This agreement describes the care supports to be delivered. You can pause, ask for changes, or request a support person before accepting.",
        }),
        status: "proposed",
      },
    });
  }

  const meta = parseAgreementMeta(agreement.placeholderSummary);
  const status =
    meta.status ??
    (agreement.status === "placeholder"
      ? "placeholder"
      : (agreement.status as AccessibleServiceAgreementView["status"]));

  return {
    id: agreement.id,
    careBookingId,
    version: meta.version,
    status,
    title: agreement.placeholderTitle,
    plainLanguageSummary:
      typeof agreement.placeholderSummary === "string" &&
      !agreement.placeholderSummary.startsWith("{")
        ? agreement.placeholderSummary
        : "This agreement describes the care supports to be delivered. You can pause, ask for changes, or request a support person before accepting.",
    supportedDecisionMakingOffered: meta.supportedDecisionMakingOffered,
    accessibleFormats: meta.formats,
    acceptedAt: meta.acceptedAt,
    acceptedByUserId: meta.acceptedByUserId,
    expiresAt: meta.expiresAt,
  };
}

/**
 * Participant (or authorised delegate path via access control) accepts a versioned agreement.
 * Does not invent legal certification. GPS check-in is never required.
 */
export async function acceptAccessibleServiceAgreement(input: {
  careBookingId: string;
  actor: CurrentUser;
  acknowledgement: string;
}): Promise<AccessibleServiceAgreementView> {
  const ack = input.acknowledgement.trim();
  if (ack.length < 8) {
    throw new Error("ACK_REQUIRED");
  }

  const view = await getOrCreateAccessibleServiceAgreement(
    input.careBookingId,
    input.actor,
  );
  const booking = await prisma.careBooking.findUnique({
    where: { id: input.careBookingId },
  });
  if (!booking) throw new Error("NOT_FOUND");
  try {
    assertParticipantOwnsBooking(input.actor, booking);
  } catch {
    throw new Error("PARTICIPANT_ONLY");
  }

  const acceptedAt = new Date().toISOString();
  const nextVersion = view.version;
  const payload = {
    __mapableAgreement: true,
    version: nextVersion,
    status: "accepted" as const,
    formats: view.accessibleFormats,
    supportedDecisionMakingOffered: true,
    acceptedAt,
    acceptedByUserId: input.actor.id,
    acknowledgement: ack,
    body: view.plainLanguageSummary,
  };

  await prisma.careServiceAgreement.update({
    where: { id: view.id },
    data: {
      status: "accepted",
      placeholderSummary: JSON.stringify(payload),
    },
  });

  await createAuditEvent({
    actorUserId: input.actor.id,
    action: "care_agreement.accepted",
    entityType: "CareServiceAgreement",
    entityId: view.id,
    organisationId: booking.organisationId,
    participantId: booking.participantId,
    metadata: { version: nextVersion },
  });

  return getOrCreateAccessibleServiceAgreement(input.careBookingId, input.actor);
}
