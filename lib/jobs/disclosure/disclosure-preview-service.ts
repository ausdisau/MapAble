import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { ensureJobsParticipationEnabled } from "@/lib/config/jobs-participation";
import { assertJobsFairnessAllowed } from "@/lib/jobs/fairness-boundaries";
import { sanitizeApplicationForViewer } from "@/lib/jobs/job-service";
import { prisma } from "@/lib/prisma";

type DisclosureFieldMap = Record<string, unknown>;

function buildEmployerVisiblePreview(input: {
  application: {
    applicantSummary: string | null;
    coverLetter: string | null;
    reasonableAdjustmentRequest: string | null;
    shareAdjustments: boolean;
    transportSupportNeeded: boolean;
    careSupportNeeded: boolean;
  };
  fieldsToDisclose: DisclosureFieldMap;
}): DisclosureFieldMap {
  const visible: DisclosureFieldMap = {};

  if (input.fieldsToDisclose.applicantSummary && input.application.applicantSummary) {
    visible.applicantSummary = input.application.applicantSummary;
  }
  if (input.fieldsToDisclose.coverLetter && input.application.coverLetter) {
    visible.coverLetter = input.application.coverLetter;
  }
  if (
    input.fieldsToDisclose.reasonableAdjustmentRequest &&
    input.application.shareAdjustments &&
    input.application.reasonableAdjustmentRequest
  ) {
    visible.reasonableAdjustmentRequest =
      input.application.reasonableAdjustmentRequest;
  } else if (input.application.reasonableAdjustmentRequest) {
    visible.reasonableAdjustmentRequest =
      "[Adjustment request on file — not shared with employer]";
  }
  if (input.fieldsToDisclose.transportSupportNeeded) {
    visible.transportSupportNeeded = input.application.transportSupportNeeded;
  }
  if (input.fieldsToDisclose.careSupportNeeded) {
    visible.careSupportNeeded = input.application.careSupportNeeded;
  }

  return visible;
}

function buildWithheldFields(
  fieldsToDisclose: DisclosureFieldMap,
  allFields: string[],
): DisclosureFieldMap {
  const withheld: DisclosureFieldMap = {};
  for (const field of allFields) {
    if (!fieldsToDisclose[field]) {
      withheld[field] = "Withheld by participant";
    }
  }
  return withheld;
}

const DISCLOSURE_FIELDS = [
  "applicantSummary",
  "coverLetter",
  "reasonableAdjustmentRequest",
  "transportSupportNeeded",
  "careSupportNeeded",
] as const;

export async function buildDisclosurePreview(
  applicationId: string,
  participantId: string,
) {
  ensureJobsParticipationEnabled();
  assertJobsFairnessAllowed("undisclosed_disability_sharing");

  const application = await prisma.jobApplication.findFirst({
    where: { id: applicationId, participantId },
  });
  if (!application) throw new Error("APPLICATION_NOT_FOUND");

  const profile = await prisma.employmentProfile.findUnique({
    where: { participantId },
  });

  const disclosureChoices =
    typeof profile?.disclosureChoices === "object" &&
    profile.disclosureChoices !== null
      ? (profile.disclosureChoices as DisclosureFieldMap)
      : {};

  const fieldsToDisclose: DisclosureFieldMap = {
    applicantSummary: disclosureChoices.applicantSummary ?? true,
    coverLetter: disclosureChoices.coverLetter ?? true,
    reasonableAdjustmentRequest:
      application.shareAdjustments &&
      (disclosureChoices.reasonableAdjustmentRequest ?? false),
    transportSupportNeeded: disclosureChoices.transportSupportNeeded ?? false,
    careSupportNeeded: disclosureChoices.careSupportNeeded ?? false,
  };

  const employerVisible = buildEmployerVisiblePreview({
    application,
    fieldsToDisclose,
  });

  const fieldsWithheld = buildWithheldFields(
    fieldsToDisclose,
    [...DISCLOSURE_FIELDS],
  );

  const preview = await prisma.applicationDisclosurePreview.upsert({
    where: { applicationId },
    create: {
      applicationId,
      participantId,
      fieldsToDisclose: fieldsToDisclose as Prisma.InputJsonValue,
      fieldsWithheld: fieldsWithheld as Prisma.InputJsonValue,
      employerVisible: employerVisible as Prisma.InputJsonValue,
      status: "previewed",
    },
    update: {
      fieldsToDisclose: fieldsToDisclose as Prisma.InputJsonValue,
      fieldsWithheld: fieldsWithheld as Prisma.InputJsonValue,
      employerVisible: employerVisible as Prisma.InputJsonValue,
      status: "previewed",
    },
  });

  return preview;
}

export async function updateDisclosureChoices(input: {
  applicationId: string;
  participantId: string;
  fieldsToDisclose: DisclosureFieldMap;
}) {
  ensureJobsParticipationEnabled();
  assertJobsFairnessAllowed("undisclosed_disability_sharing");

  const application = await prisma.jobApplication.findFirst({
    where: { id: input.applicationId, participantId: input.participantId },
  });
  if (!application) throw new Error("APPLICATION_NOT_FOUND");

  if (
    input.fieldsToDisclose.reasonableAdjustmentRequest &&
    !application.shareAdjustments
  ) {
    throw new Error("ADJUSTMENT_SHARING_NOT_ENABLED");
  }

  const employerVisible = buildEmployerVisiblePreview({
    application,
    fieldsToDisclose: input.fieldsToDisclose,
  });

  const fieldsWithheld = buildWithheldFields(
    input.fieldsToDisclose,
    [...DISCLOSURE_FIELDS],
  );

  const preview = await prisma.applicationDisclosurePreview.upsert({
    where: { applicationId: input.applicationId },
    create: {
      applicationId: input.applicationId,
      participantId: input.participantId,
      fieldsToDisclose: input.fieldsToDisclose as Prisma.InputJsonValue,
      fieldsWithheld: fieldsWithheld as Prisma.InputJsonValue,
      employerVisible: employerVisible as Prisma.InputJsonValue,
      status: "previewed",
    },
    update: {
      fieldsToDisclose: input.fieldsToDisclose as Prisma.InputJsonValue,
      fieldsWithheld: fieldsWithheld as Prisma.InputJsonValue,
      employerVisible: employerVisible as Prisma.InputJsonValue,
      status: "previewed",
    },
  });

  await createAuditEvent({
    actorUserId: input.participantId,
    participantId: input.participantId,
    action: "application_disclosure_preview.updated",
    entityType: "ApplicationDisclosurePreview",
    entityId: preview.id,
  });

  return preview;
}

export async function confirmDisclosurePreview(
  applicationId: string,
  participantId: string,
) {
  ensureJobsParticipationEnabled();
  assertJobsFairnessAllowed("undisclosed_disability_sharing");

  const preview = await prisma.applicationDisclosurePreview.findFirst({
    where: { applicationId, participantId },
  });
  if (!preview) throw new Error("DISCLOSURE_PREVIEW_NOT_FOUND");

  const confirmed = await prisma.applicationDisclosurePreview.update({
    where: { id: preview.id },
    data: { status: "confirmed", confirmedAt: new Date() },
  });

  await createAuditEvent({
    actorUserId: participantId,
    participantId,
    action: "application_disclosure_preview.confirmed",
    entityType: "ApplicationDisclosurePreview",
    entityId: confirmed.id,
  });

  return confirmed;
}

export async function getEmployerSafeApplicationView(
  applicationId: string,
  viewerUserId: string,
  opts: { isEmployerWithConsent: boolean; isAdmin: boolean },
) {
  ensureJobsParticipationEnabled();

  const app = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { disclosurePreview: true },
  });
  if (!app) throw new Error("APPLICATION_NOT_FOUND");

  if (app.disclosurePreview?.status === "confirmed") {
    const visible = (app.disclosurePreview.employerVisible ?? {}) as DisclosureFieldMap;
    return {
      ...app,
      applicantSummary: (visible.applicantSummary as string | null | undefined) ?? null,
      coverLetter: (visible.coverLetter as string | null | undefined) ?? null,
      reasonableAdjustmentRequest:
        (visible.reasonableAdjustmentRequest as string | null | undefined) ?? null,
      transportSupportNeeded: Boolean(visible.transportSupportNeeded),
      careSupportNeeded: Boolean(visible.careSupportNeeded),
    };
  }

  return sanitizeApplicationForViewer(app, {
    isParticipant: app.participantId === viewerUserId,
    isEmployerWithConsent: opts.isEmployerWithConsent,
    isAdmin: opts.isAdmin,
  });
}
