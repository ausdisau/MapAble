import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { buildParticipantRightsSnapshot } from "@/lib/intelligence/careos/context/participant-rights";
import { prisma } from "@/lib/prisma";
import {
  compareDeclaredPractices,
  ParticipantFitRequestSchema,
  type DeclaredPractice,
} from "@/lib/support-builder/relational-fit";

export const dynamic = "force-dynamic";

function previewEnabled(): boolean {
  return (
    process.env.VERCEL_ENV !== "production" &&
    process.env.MAPABLE_SUPPORT_BUILDER_ENABLED === "true" &&
    process.env.MAPABLE_RELATIONAL_FIT_ENABLED === "true"
  );
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

export async function POST(request: Request) {
  if (!previewEnabled()) return Response.json({ error: "Not available." }, { status: 404 });
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;
  // v1 handles only a participant's own preferences, never a guessed delegate.
  if (!actor.roles.includes("participant")) {
    return Response.json(
      { error: "Only a signed-in participant can request their own shortlist in v1." },
      { status: 403 },
    );
  }
  if (!checkIpRateLimit(getClientIp(request), { windowMs: 60_000, max: 8 })) {
    return Response.json({ error: "Please wait before searching again." }, { status: 429 });
  }
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 3500) return Response.json({ error: "Search is too long." }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = ParticipantFitRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Review your chosen working preferences." }, { status: 400 });
  }

  try {
    const rights = await buildParticipantRightsSnapshot(actor.id);
    if (rights.requiredGenderPreference || rights.participantHardExclusions.length > 0) {
      // It is unsafe to infer or silently ignore eligibility restrictions that
      // this bounded v1 matching service cannot enforce.
      return Response.json({
        candidates: [],
        humanReviewRequired: true,
        reason: "Additional participant-defined boundaries require a human-assisted search.",
      }, { status: 200, headers: { "Cache-Control": "private, no-store" } });
    }

    const workers = await prisma.workerProfile.findMany({
      where: {
        active: true,
        userId: { not: null },
        verificationStatus: "verified",
        workerScreeningStatus: "verified",
        organisation: { status: "active", verificationStatus: "verified" },
        relationalFitProfile: { isNot: null },
      },
      select: {
        id: true,
        displayName: true,
        organisationId: true,
        serviceTypes: true,
        serviceRegions: true,
        languages: true,
        communicationCapabilities: true,
        workerScreeningStatus: true,
        verificationStatus: true,
        organisation: { select: { name: true } },
        relationalFitProfile: {
          select: {
            communicationModes: true,
            routineStyle: true,
            interactionStyle: true,
            initiativeStyle: true,
            continuityStyle: true,
            updatedAt: true,
          },
        },
        credentialEvidence: {
          select: {
            credentialType: true,
            verificationStatus: true,
            expiresAt: true,
            revokedAt: true,
          },
        },
      },
      orderBy: { displayName: "asc" },
      take: 100,
    });

    const now = Date.now();
    const blockedWorkers = new Set(rights.blockedWorkerIds);
    const blockedProviders = new Set(rights.blockedProviderIds);
    const candidates = workers.flatMap((worker) => {
      const profile = worker.relationalFitProfile;
      if (!profile) return [];
      if (blockedWorkers.has(worker.id) || blockedProviders.has(worker.organisationId)) return [];
      if (
        rights.requiredLanguagePreference &&
        !worker.languages.some(
          (language) => language.toLowerCase() === rights.requiredLanguagePreference?.toLowerCase(),
        )
      ) return [];

      const declaredModes = new Set(
        [
          ...profile.communicationModes,
          ...(Array.isArray(worker.communicationCapabilities)
            ? worker.communicationCapabilities.filter(
                (item): item is string => typeof item === "string",
              )
            : []),
        ].map((value) => value.trim().toLowerCase()),
      );
      if (
        rights.requiredCommunicationCapabilities.some(
          (method) => !declaredModes.has(method.trim().toLowerCase()),
        )
      ) return [];

      // Role-required credentials are treated as essential and must have
      // recorded current evidence; a free-text qualifications field is insufficient.
      if (rights.requiredWorkerCredentials.some((credential) =>
        !worker.credentialEvidence.some((evidence) =>
          evidence.credentialType.toLowerCase() === credential.toLowerCase() &&
          evidence.verificationStatus === "verified" &&
          !evidence.revokedAt &&
          (!evidence.expiresAt || evidence.expiresAt.getTime() > now),
        ),
      )) return [];

      const comparison = compareDeclaredPractices(
        parsed.data,
        profile as DeclaredPractice,
      );
      if (!comparison.fitsEssentialPreferences) return [];

      const localityNote = parsed.data.locality
        ? "Service area near " + parsed.data.locality +
          " has not been independently verified. Worker-declared regions: " +
          (worker.serviceRegions.join(", ") || "not supplied") + "."
        : "Service area and travel requirements have not been checked.";

      return [{
        workerId: worker.id,
        workerName: worker.displayName,
        organisationName: worker.organisation.name,
        declaredServiceTypes: worker.serviceTypes.slice(0, 10),
        comparison,
        localityNote,
        lastWorkstyleDeclarationAt: profile.updatedAt.toISOString(),
        evidenceLimitations: [
          "Screening and provider status are recorded internally; current status must be independently verified through authorised channels.",
          "Availability, task-specific qualifications, suitability, worker acceptance and the participant's final choice are not confirmed.",
          "Preferences and approaches are worker-declared, not independently tested or assessed.",
        ],
        selectionStatus: "review_required" as const,
      }];
    }).sort((a, b) =>
      b.comparison.alignmentCount - a.comparison.alignmentCount ||
      a.workerName.localeCompare(b.workerName),
    ).slice(0, 12);

    // Audit the access event, not the sensitive participant preferences.
    await createAuditEvent({
      actorUserId: actor.id,
      actorRole: actor.primaryRole,
      participantId: actor.id,
      action: "relational_fit.shortlist_viewed",
      entityType: "RelationalFitPreview",
      metadata: { resultCount: candidates.length, consentVersion: "v1" },
    });

    return Response.json({
      candidates,
      humanReviewRequired: true,
      reason: candidates.length
        ? "Potential leads are ordered by documented workstyle overlaps. This is not a predicted compatibility score or employment recommendation."
        : "No worker opted into matching with enough matching recorded information. This is not proof that suitable workers are unavailable.",
      modelUsed: false,
      storedParticipantPreferences: false,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    // Fail closed when the participant rights store, worker eligibility data,
    // audit service, consent profile table or database is unavailable.
    return Response.json({
      error: "Matching is unavailable. Nothing was assigned or shared. Please use human-assisted support discovery.",
    }, { status: 503 });
  }
}
