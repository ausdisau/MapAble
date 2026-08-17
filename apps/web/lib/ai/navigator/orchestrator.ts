import {
  NAVIGATOR_CONSENT_PURPOSE,
  verifyPurposeConsent,
} from "@/lib/ai/navigator/consent-gate";
import { createGovernedActionEnvelope } from "@/lib/ai/navigator/envelopes/service";
import {
  assertNavigatorActionAllowed,
  assertNavigatorCapability,
} from "@/lib/ai/navigator/gates";
import { applyHardConstraints } from "@/lib/ai/navigator/matching/hard-constraints";
import { buildMatchResult } from "@/lib/ai/navigator/matching/rank";
import { ndisProviderHardFilter } from "@/lib/ai/navigator/matching/search-tool";
import {
  DEFAULT_RANKING_WEIGHTS,
  hardConstraintsSchema,
  rankingWeightsSchema,
  type HardConstraints,
  type HardConstraintsInput,
  type MatchResult,
  type RankingWeights,
} from "@/lib/ai/navigator/matching/types";
import { createDecisionPassport } from "@/lib/ai/navigator/passport/service";
import {
  isNavigatorMatchingEnabled,
  isNavigatorPassportEnabled,
  navigatorPilotConfig,
} from "@/lib/config/navigator-pilot";
import { interpretSearchQuery } from "@/lib/search/interpreter";
import type { ConsentScope } from "@/types/mapable";
import type { SearchInterpretation } from "@/types/search";

export type NavigatorStructuredFilters = {
  q?: string;
  location?: string;
  service?: string;
  access?: string;
  provider?: string;
  state?: string;
  postcode?: string;
};

export type ReviewedInterpretation = {
  sourceQuery: string;
  filters: NavigatorStructuredFilters;
  serviceCategorySlug: string | null;
  confidence: number;
  engineId: string;
  awaitingConfirmation: boolean;
  modelAssisted: boolean;
};

export type NavigatorProviderSearchTurnInput = {
  tenantId: string;
  participantId: string;
  actorUserId: string;
  /** Optional session id for Decision Passport correlation. */
  sessionId?: string;
  goalText?: string;
  structuredFilters?: NavigatorStructuredFilters;
  hardConstraints: HardConstraintsInput;
  rankingWeights?: RankingWeights;
  interpretationConfirmed: boolean;
  aiOptedOut?: boolean;
  consentScope?: ConsentScope;
  consentPurpose?: string;
  consentAction?: string;
  /** Participant-controlled fields allowed for this purpose (consent gate). */
  permittedFields?: string[];
  /** When true, create a transfer_filters_to_finder envelope after match. */
  transferFilters?: boolean;
  saveDraft?: boolean;
  silent?: boolean;
  now?: Date;
};

export type NavigatorProviderSearchTurnResult =
  | {
      status: "needs_review";
      interpretation: ReviewedInterpretation;
      match: null;
      draftEnvelopeId: null;
      transferEnvelopeId: null;
      passportId: null;
    }
  | {
      status: "matched" | "NO_SAFE_MATCH" | "blocked";
      interpretation: ReviewedInterpretation;
      match: MatchResult | null;
      draftEnvelopeId: string | null;
      transferEnvelopeId: string | null;
      passportId: string | null;
      reason?: string;
    };

function passthroughInterpretation(
  input: NavigatorProviderSearchTurnInput,
): ReviewedInterpretation {
  const filters: NavigatorStructuredFilters = {
    q: input.structuredFilters?.q ?? input.goalText?.trim() ?? "",
    location: input.structuredFilters?.location ?? "",
    service:
      input.structuredFilters?.service ??
      input.hardConstraints.serviceType ??
      "",
    access: input.structuredFilters?.access ?? "",
    provider: input.structuredFilters?.provider ?? "",
    state: input.structuredFilters?.state ?? input.hardConstraints.state,
    postcode:
      input.structuredFilters?.postcode ?? input.hardConstraints.postcode,
  };
  return {
    sourceQuery: input.goalText?.trim() ?? filters.q ?? "",
    filters,
    serviceCategorySlug: null,
    confidence: filters.q || filters.service ? 0.4 : 0,
    engineId: "navigator/passthrough",
    awaitingConfirmation: !input.interpretationConfirmed,
    modelAssisted: false,
  };
}

function fromSearchInterpretation(
  interpreted: SearchInterpretation,
  confirmed: boolean,
  modelAssisted: boolean,
): ReviewedInterpretation {
  return {
    sourceQuery: interpreted.sourceQuery,
    filters: {
      q: interpreted.filters.q,
      location: interpreted.filters.location,
      service: interpreted.filters.service,
      access: interpreted.filters.access,
      provider: interpreted.filters.provider,
    },
    serviceCategorySlug: interpreted.serviceCategorySlug,
    confidence: interpreted.confidence,
    engineId: interpreted.engineId,
    awaitingConfirmation: !confirmed,
    modelAssisted,
  };
}

async function buildReviewedInterpretation(
  input: NavigatorProviderSearchTurnInput,
): Promise<ReviewedInterpretation> {
  const modelAssisted =
    !input.aiOptedOut && navigatorPilotConfig.modelAssistedEnabled;

  if (!modelAssisted) {
    if (input.structuredFilters) {
      return passthroughInterpretation(input);
    }
    // Deterministic interpret path (interpreter has safe/rules fallbacks).
    if (input.goalText?.trim()) {
      const interpreted = await interpretSearchQuery(input.goalText);
      return fromSearchInterpretation(
        interpreted,
        input.interpretationConfirmed,
        false,
      );
    }
    return passthroughInterpretation(input);
  }

  // Model-assisted flag on: still use governed interpret capability gate.
  const interpretGate = await assertNavigatorCapability({
    capabilityKey: "navigator.provider_search.interpret",
    tenantId: input.tenantId,
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    silent: input.silent,
  });
  if (!interpretGate.allowed) {
    // Fail closed to deterministic passthrough rather than inventing filters.
    return passthroughInterpretation(input);
  }

  if (input.goalText?.trim()) {
    const interpreted = await interpretSearchQuery(input.goalText);
    return fromSearchInterpretation(
      interpreted,
      input.interpretationConfirmed,
      true,
    );
  }
  return passthroughInterpretation(input);
}

function mergeConstraintsFromInterpretation(
  constraints: HardConstraints,
  interpretation: ReviewedInterpretation,
): HardConstraints {
  return hardConstraintsSchema.parse({
    ...constraints,
    serviceType:
      constraints.serviceType ??
      (interpretation.filters.service
        ? interpretation.filters.service
        : undefined),
    state:
      constraints.state ??
      (interpretation.filters.state ? interpretation.filters.state : undefined),
    postcode:
      constraints.postcode ??
      (interpretation.filters.postcode
        ? interpretation.filters.postcode
        : undefined),
  });
}

/**
 * Bounded Navigator provider-search turn.
 * Never books, pays, or dispatches. Hard constraints never relaxed.
 */
export async function runNavigatorProviderSearchTurn(
  input: NavigatorProviderSearchTurnInput,
): Promise<NavigatorProviderSearchTurnResult> {
  // Permanent prohibitions — never book/pay/dispatch from this path.
  assertNavigatorActionAllowed("search_providers");

  const consentAction =
    input.consentAction ??
    (input.interpretationConfirmed ? "match" : "interpret");

  const consent = await verifyPurposeConsent({
    tenantId: input.tenantId,
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    scope: input.consentScope ?? "profile.read",
    purpose: input.consentPurpose ?? NAVIGATOR_CONSENT_PURPOSE,
    action: consentAction,
    permittedFields: input.permittedFields,
    delegationDomain: "navigator",
    silent: input.silent,
  });
  if (!consent.ok) {
    return {
      status: "blocked",
      interpretation: passthroughInterpretation(input),
      match: null,
      draftEnvelopeId: null,
      transferEnvelopeId: null,
      passportId: null,
      reason: `consent_${consent.reason}`,
    };
  }

  const constraints = hardConstraintsSchema.parse(input.hardConstraints);
  const weights = rankingWeightsSchema.parse(
    input.rankingWeights ?? DEFAULT_RANKING_WEIGHTS,
  );

  const interpretation = await buildReviewedInterpretation(input);

  if (!input.interpretationConfirmed || interpretation.awaitingConfirmation) {
    return {
      status: "needs_review",
      interpretation: {
        ...interpretation,
        awaitingConfirmation: true,
      },
      match: null,
      draftEnvelopeId: null,
      transferEnvelopeId: null,
      passportId: null,
    };
  }

  // Matching / search requires matching flag + mid-flow gate re-check.
  if (!isNavigatorMatchingEnabled()) {
    return {
      status: "blocked",
      interpretation,
      match: null,
      draftEnvelopeId: null,
      transferEnvelopeId: null,
      passportId: null,
      reason: "matching_disabled",
    };
  }

  const matchGate = await assertNavigatorCapability({
    capabilityKey: "navigator.provider_search.match",
    tenantId: input.tenantId,
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    silent: input.silent,
  });
  if (!matchGate.allowed) {
    return {
      status: "blocked",
      interpretation,
      match: null,
      draftEnvelopeId: null,
      transferEnvelopeId: null,
      passportId: null,
      reason: matchGate.reason,
    };
  }

  const effectiveConstraints = mergeConstraintsFromInterpretation(
    constraints,
    interpretation,
  );

  const search = await ndisProviderHardFilter({
    tenantId: input.tenantId,
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    constraints: effectiveConstraints,
    q:
      interpretation.filters.q ||
      interpretation.filters.service ||
      input.goalText ||
      undefined,
    silent: input.silent,
    now: input.now,
  });

  const applied = applyHardConstraints(
    search.candidates,
    effectiveConstraints,
    input.now,
  );

  const match = buildMatchResult({
    eligible: applied.eligible,
    eliminationSummary: applied.eliminationSummary,
    constraints: effectiveConstraints,
    weights,
    now: input.now,
  });

  let passportId: string | null = null;
  if (input.sessionId && isNavigatorPassportEnabled()) {
    try {
      const passport = await createDecisionPassport({
        tenantId: input.tenantId,
        participantId: input.participantId,
        actorUserId: input.actorUserId,
        sessionId: input.sessionId,
        goalSummary: (
          input.goalText ??
          interpretation.filters.service ??
          "provider search"
        ).slice(0, 500),
        interpretation: {
          summary: interpretation.sourceQuery.slice(0, 1000),
          serviceType:
            effectiveConstraints.serviceType ?? interpretation.filters.service,
          locationLabel: interpretation.filters.location,
        },
        hardConstraints: [
          ...(effectiveConstraints.serviceType
            ? [
                {
                  label: "serviceType",
                  value: effectiveConstraints.serviceType,
                  nonNegotiable:
                    effectiveConstraints.nonNegotiableKeys.includes(
                      "serviceType",
                    ),
                },
              ]
            : []),
          ...(effectiveConstraints.state
            ? [
                {
                  label: "state",
                  value: effectiveConstraints.state,
                  nonNegotiable:
                    effectiveConstraints.nonNegotiableKeys.includes("state"),
                },
              ]
            : []),
          ...(effectiveConstraints.postcode
            ? [
                {
                  label: "postcode",
                  value: effectiveConstraints.postcode,
                  nonNegotiable:
                    effectiveConstraints.nonNegotiableKeys.includes("postcode"),
                },
              ]
            : []),
          ...effectiveConstraints.exclusions.map((ex) => ({
            label: "exclusion",
            value: ex,
            nonNegotiable:
              effectiveConstraints.nonNegotiableKeys.includes("exclusions"),
          })),
        ],
        rankingWeights: {
          participantPreference: weights.participantPreference,
          accessibilityFit: weights.verifiedAccessibility,
          availability: weights.availability,
          proximity: weights.travelBurden,
        },
        sources: [{ label: "ndis_provider_hard_filter", kind: "tool" }],
        shortlist: match.shortlist.map((entry) => ({
          id: entry.provider.id,
          label: entry.provider.name,
          factors: entry.materialFactors,
          score: entry.score,
        })),
        limitationsNotes: match.limitations,
        conflictsOfInterest: match.shortlist
          .filter((s) => s.provider.sponsored || s.provider.relatedParty)
          .map((s) =>
            s.provider.sponsored
              ? `Sponsored listing: ${s.provider.id}`
              : `Related party: ${s.provider.id}`,
          ),
        aiInvolved: interpretation.modelAssisted && !input.aiOptedOut,
        modelIndependentRules: [
          "Hard constraints are never relaxed.",
          "Sponsored status does not change eligibility.",
        ],
        nextStep:
          match.status === "NO_SAFE_MATCH"
            ? "No safe match — refine constraints or request human help"
            : "Review shortlist and optionally save a draft service request",
        nextStepController: "participant",
        consentedPurpose: input.consentPurpose ?? NAVIGATOR_CONSENT_PURPOSE,
        consentRecordId: consent.consentRecordId,
      });
      passportId = passport.id;
    } catch {
      // Passport failures must not block the match result.
    }
  }

  let draftEnvelopeId: string | null = null;
  let transferEnvelopeId: string | null = null;
  if (input.saveDraft && match.status === "eligible_shortlist") {
    const envelope = await createGovernedActionEnvelope({
      tenantId: input.tenantId,
      participantId: input.participantId,
      initiatingUserId: input.actorUserId,
      capabilityKey: "navigator.provider_search.draft_service_request",
      action: "create_service_request_draft",
      payload: {
        serviceType:
          effectiveConstraints.serviceType ??
          interpretation.filters.service ??
          "provider_search",
        locationLabel:
          interpretation.filters.location ||
          effectiveConstraints.postcode ||
          effectiveConstraints.state ||
          "unspecified",
        providerOutletIds: match.shortlist
          .map((s) => s.provider.id)
          .slice(0, 20),
        hardConstraintsSummary: Object.keys(applied.eliminationSummary),
      },
      evidenceRefs: match.shortlist.map((s) => s.provider.id),
      sourceRefs: ["navigator.provider_search.match"],
      consentReceiptId: consent.consentReceiptId ?? consent.consentRecordId,
      requiredApproverRole: "participant",
    });
    draftEnvelopeId = envelope.id;
  }

  if (input.transferFilters) {
    const transferEnvelope = await createGovernedActionEnvelope({
      tenantId: input.tenantId,
      participantId: input.participantId,
      initiatingUserId: input.actorUserId,
      capabilityKey: "navigator.provider_search.draft_service_request",
      action: "transfer_filters_to_finder",
      payload: {
        query: interpretation.filters.q || interpretation.sourceQuery,
        location: interpretation.filters.location,
        serviceQuery:
          interpretation.filters.service || effectiveConstraints.serviceType,
        accessQuery: interpretation.filters.access,
        providerName: interpretation.filters.provider,
        appliedFilters: {
          state: effectiveConstraints.state,
          postcode: effectiveConstraints.postcode,
          nonNegotiableKeys: effectiveConstraints.nonNegotiableKeys,
        },
      },
      evidenceRefs: match.shortlist.map((s) => s.provider.id),
      sourceRefs: ["navigator.provider_search.match"],
      consentReceiptId: consent.consentReceiptId ?? consent.consentRecordId,
      requiredApproverRole: "participant",
    });
    transferEnvelopeId = transferEnvelope.id;
    if (!draftEnvelopeId) draftEnvelopeId = transferEnvelope.id;
  }

  return {
    status: match.status === "NO_SAFE_MATCH" ? "NO_SAFE_MATCH" : "matched",
    interpretation: {
      ...interpretation,
      awaitingConfirmation: false,
    },
    match,
    draftEnvelopeId,
    transferEnvelopeId,
    passportId,
  };
}
