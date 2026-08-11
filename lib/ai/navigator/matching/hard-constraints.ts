import type {
  EliminationCategory,
  EliminationSummary,
  HardConstraints,
  ProviderCandidate,
} from "@/lib/ai/navigator/matching/types";

export type HardConstraintApplication = {
  eligible: ProviderCandidate[];
  eliminated: Array<{
    providerId: string;
    category: EliminationCategory;
  }>;
  eliminationSummary: EliminationSummary;
};

function includesIgnoreCase(haystacks: string[], needle: string): boolean {
  const n = needle.trim().toLowerCase();
  if (!n) return true;
  return haystacks.some((h) => h.toLowerCase().includes(n));
}

function isExcluded(candidate: ProviderCandidate, exclusions: string[]): boolean {
  if (exclusions.length === 0) return false;
  const idLower = candidate.id.toLowerCase();
  const nameLower = candidate.name.toLowerCase();
  return exclusions.some((raw) => {
    const ex = raw.trim().toLowerCase();
    if (!ex) return false;
    return idLower === ex || nameLower === ex || nameLower.includes(ex);
  });
}

function ageInDays(updatedAt: Date, now: Date): number {
  return (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
}

function bump(
  summary: EliminationSummary,
  category: EliminationCategory,
): void {
  summary[category] = (summary[category] ?? 0) + 1;
}

/**
 * Stage 1 — deterministic hard filters. NEVER relaxes constraints.
 * Returns NO_SAFE_MATCH path when eligible is empty (caller maps status).
 */
export function applyHardConstraints(
  candidates: ProviderCandidate[],
  constraints: HardConstraints,
  now: Date = new Date(),
): HardConstraintApplication {
  const eligible: ProviderCandidate[] = [];
  const eliminated: HardConstraintApplication["eliminated"] = [];
  const eliminationSummary: EliminationSummary = {};

  for (const candidate of candidates) {
    const fail = (category: EliminationCategory) => {
      eliminated.push({ providerId: candidate.id, category });
      bump(eliminationSummary, category);
    };

    if (constraints.serviceType) {
      const haystack = [
        ...candidate.services,
        ...candidate.registrationGroups,
      ];
      if (!includesIgnoreCase(haystack, constraints.serviceType)) {
        fail("service_type");
        continue;
      }
    }

    if (constraints.state) {
      const want = constraints.state.trim().toUpperCase();
      if (!candidate.state || candidate.state.trim().toUpperCase() !== want) {
        fail("geography");
        continue;
      }
    }

    if (constraints.postcode) {
      const want = constraints.postcode.trim();
      if (!candidate.postcode || candidate.postcode.trim() !== want) {
        fail("geography");
        continue;
      }
    }

    if (constraints.requiredServices.length > 0) {
      const missing = constraints.requiredServices.some(
        (svc) => !includesIgnoreCase(candidate.services, svc),
      );
      if (missing) {
        fail("service_type");
        continue;
      }
    }

    if (isExcluded(candidate, constraints.exclusions)) {
      fail("exclusion");
      continue;
    }

    if (
      constraints.requireFreshnessDays !== undefined &&
      (Number.isNaN(candidate.updatedAt.getTime()) ||
        ageInDays(candidate.updatedAt, now) > constraints.requireFreshnessDays)
    ) {
      fail("freshness");
      continue;
    }

    if (candidate.evidenceStatus === "stale" && constraints.requireFreshnessDays) {
      fail("freshness");
      continue;
    }

    if (constraints.accessibilityRequirements.length > 0) {
      const haystack = [...candidate.services, ...candidate.conflictNotes];
      const unmet = constraints.accessibilityRequirements.some(
        (req) => !includesIgnoreCase(haystack, req),
      );
      if (unmet) {
        fail("accessibility");
        continue;
      }
    }

    if (constraints.communicationRequirements.length > 0) {
      const haystack = [...candidate.services, ...candidate.conflictNotes];
      const unmet = constraints.communicationRequirements.some(
        (req) => !includesIgnoreCase(haystack, req),
      );
      if (unmet) {
        fail("communication");
        continue;
      }
    }

    if (constraints.credentialRequirements.length > 0) {
      const haystack = [
        ...candidate.services,
        ...candidate.registrationGroups,
        ...candidate.conflictNotes,
      ];
      const unmet = constraints.credentialRequirements.some(
        (req) => !includesIgnoreCase(haystack, req),
      );
      if (unmet) {
        fail("credential");
        continue;
      }
    }

    if (constraints.excludeSponsoredOnly && candidate.sponsored) {
      fail("sponsored_policy");
      continue;
    }

    eligible.push(candidate);
  }

  return { eligible, eliminated, eliminationSummary };
}
