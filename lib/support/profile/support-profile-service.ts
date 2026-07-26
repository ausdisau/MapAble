import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { y1WedgeConfig } from "@/lib/config/y1-wedge";
import { checkConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";
import type { ConsentScope } from "@/types/mapable";

import {
  defaultSupportProfileSections,
  mergeSupportProfileSections,
  parseSupportProfileSections,
  type SupportProfileSections,
} from "./types";

const COORDINATOR_SCOPE: ConsentScope = "support_coordination.access";
const WORKER_SCOPE: ConsentScope = "support_profile.read";

export async function getSupportProfileForViewer(params: {
  participantId: string;
  viewer: CurrentUser;
  grantedToOrganisationId?: string;
}) {
  if (!y1WedgeConfig.supportProfileEnabled) {
    throw new Error("SUPPORT_PROFILE_DISABLED");
  }

  const profile = await prisma.supportProfile.findUnique({
    where: { participantId: params.participantId },
  });

  if (!profile || !profile.publishedAt) {
    return null;
  }

  const isOwner = params.viewer.id === params.participantId;
  const isAdmin = isAdminRole(params.viewer.primaryRole);

  if (!isOwner && !isAdmin) {
    const scope =
      params.viewer.primaryRole === "support_coordinator"
        ? COORDINATOR_SCOPE
        : WORKER_SCOPE;
    const allowed = await checkConsent({
      subjectUserId: params.participantId,
      scope,
      grantedToUserId:
        params.viewer.primaryRole === "support_worker"
          ? params.viewer.id
          : undefined,
      grantedToOrganisationId: params.grantedToOrganisationId,
    });
    if (!allowed) throw new Error("CONSENT_REQUIRED");
  }

  return {
    ...profile,
    sections: parseSupportProfileSections(profile),
  };
}

export async function getOrCreateDraftSupportProfile(participantId: string) {
  if (!y1WedgeConfig.supportProfileEnabled) {
    throw new Error("SUPPORT_PROFILE_DISABLED");
  }

  const existing = await prisma.supportProfile.findUnique({
    where: { participantId },
  });
  if (existing) {
    return {
      ...existing,
      sections: parseSupportProfileSections(existing),
    };
  }

  const defaults = defaultSupportProfileSections();
  const created = await prisma.supportProfile.create({
    data: {
      participantId,
      routinesJson: defaults.routinesJson,
      preferencesJson: defaults.preferencesJson,
      boundariesJson: defaults.boundariesJson,
      escalationJson: defaults.escalationJson,
    },
  });

  return {
    ...created,
    sections: parseSupportProfileSections(created),
  };
}

export async function saveSupportProfileDraft(params: {
  participantId: string;
  actorUserId: string;
  patch: Partial<SupportProfileSections>;
}) {
  const current = await getOrCreateDraftSupportProfile(params.participantId);
  const merged = mergeSupportProfileSections(current.sections, params.patch);

  const updated = await prisma.supportProfile.update({
    where: { participantId: params.participantId },
    data: {
      routinesJson: merged.routinesJson,
      preferencesJson: merged.preferencesJson,
      boundariesJson: merged.boundariesJson,
      escalationJson: merged.escalationJson,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "support_profile.draft_saved",
    entityType: "SupportProfile",
    entityId: updated.id,
    participantId: params.participantId,
    metadata: { version: updated.version },
  });

  return {
    ...updated,
    sections: parseSupportProfileSections(updated),
  };
}

export async function publishSupportProfile(params: {
  participantId: string;
  actorUserId: string;
}) {
  const updated = await prisma.supportProfile.update({
    where: { participantId: params.participantId },
    data: {
      publishedAt: new Date(),
      version: { increment: 1 },
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "support_profile.published",
    entityType: "SupportProfile",
    entityId: updated.id,
    participantId: params.participantId,
    metadata: { version: updated.version },
  });

  return {
    ...updated,
    sections: parseSupportProfileSections(updated),
  };
}

export async function getWorkerBriefSliceForShift(shiftId: string) {
  if (!y1WedgeConfig.supportProfileEnabled) return null;

  const shift = await prisma.careShift.findUnique({
    where: { id: shiftId },
    include: { workerProfile: true },
  });
  if (!shift) throw new Error("NOT_FOUND");

  const profile = await prisma.supportProfile.findUnique({
    where: { participantId: shift.participantId },
  });
  if (!profile?.publishedAt) return null;

  const allowed = await checkConsent({
    subjectUserId: shift.participantId,
    scope: WORKER_SCOPE,
    grantedToOrganisationId: shift.organisationId,
  });
  if (!allowed) return null;

  const sections = parseSupportProfileSections(profile);
  return {
    routines: sections.routinesJson.slice(0, 5),
    preferences: sections.preferencesJson.slice(0, 5),
    boundaries: sections.boundariesJson.slice(0, 5),
    escalation: sections.escalationJson,
    version: profile.version,
  };
}

export async function getPublishedSupportProfileSections(participantId: string) {
  const profile = await prisma.supportProfile.findUnique({
    where: { participantId },
  });
  if (!profile?.publishedAt) return null;
  return parseSupportProfileSections(profile);
}
