/**
 * DES / Inclusive Employment Australia (IEA) partner integration scaffolds.
 * Year-One: API shape + consent gate only — not a live outcomes payment system.
 */

export const EMPLOYMENT_PROVIDER_PROGRAMMES = [
  {
    id: "des",
    name: "Disability Employment Services",
    shortName: "DES",
    jurisdiction: "AU" as const,
    status: "scaffold" as const,
  },
  {
    id: "iea",
    name: "Inclusive Employment Australia",
    shortName: "IEA",
    jurisdiction: "AU" as const,
    status: "scaffold" as const,
  },
] as const;

export type EmploymentOutcomeMilestoneWeeks = 13 | 26;

export type EmploymentOutcomePayload = {
  participantExternalId: string;
  programmeId: "des" | "iea";
  milestoneWeeks: EmploymentOutcomeMilestoneWeeks;
  employmentStartDate: string;
  milestoneReachedAt: string;
  employerName?: string;
  notes?: string;
};

export const EMPLOYMENT_PROVIDER_SCOPES = [
  "employment_activity_read",
  "employment_outcomes_write",
] as const;

export type EmploymentProviderScope =
  (typeof EMPLOYMENT_PROVIDER_SCOPES)[number];
