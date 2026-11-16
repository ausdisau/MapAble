/**
 * MapAble Support Builder v1.
 * These are participant-editable categories, not NDIS funding or eligibility decisions.
 */
export const SUPPORT_KINDS = [
  { id: "personal-assistance", label: "Personal assistance", hint: "Getting ready and daily routines" },
  { id: "community-participation", label: "Community participation", hint: "Activities, friends and community life" },
  { id: "accessible-transport", label: "Accessible transport", hint: "Getting to and from activities" },
  { id: "therapy", label: "Therapy and allied health", hint: "Therapy enquiries and appointments" },
  { id: "support-coordination", label: "Support coordination", hint: "Coordinating services and plans" },
  { id: "employment", label: "Employment support", hint: "Finding and maintaining work" },
] as const;

export type SupportKind = (typeof SUPPORT_KINDS)[number]["id"];

export type SupportDraft = {
  locality: string;
  query: string;
  kinds: SupportKind[];
  frequency: "flexible" | "one-off" | "weekly" | "twice-weekly" | "daily";
};

export type ProviderCandidate = {
  id: string;
  name: string;
  locationLabel: string;
  serviceSignals: string[];
  website: string | null;
  sourceLabel: string;
  sourceUrl: string | null;
  lastRecordedAt: string | null;
  registrationRecorded: boolean | null;
  registrationNote: string;
  verificationStatus: "unverified";
};

export type ProviderDiscovery = {
  providers: ProviderCandidate[];
  coverageNote: string;
  sourcesChecked: string[];
};

const KEYWORDS: Record<SupportKind, RegExp> = {
  "personal-assistance": /\b(personal care|shower|dressing|getting ready|morning routine|daily living|personal assistance)\b/i,
  "community-participation": /\b(community|social|activity|activities|sport|gym|going out|shopping|friends)\b/i,
  "accessible-transport": /\b(transport|taxi|accessible vehicle|driving|drive me|getting there|journey|travel to)\b/i,
  therapy: /\b(therapy|physiotherapy|physio|occupational therapy|speech therapy|allied health|ot appointment)\b/i,
  "support-coordination": /\b(support coordinat|plan coordinat|manage my providers|find workers)\b/i,
  employment: /\b(job|employment|workplace|career|work experience|finding work)\b/i,
};

export const EMPTY_SUPPORT_DRAFT: SupportDraft = {
  locality: "",
  query: "",
  kinds: [],
  frequency: "flexible",
};

export function detectSupportKinds(input: string): SupportKind[] {
  const trimmed = input.trim().slice(0, 4000);
  if (!trimmed) return [];
  return SUPPORT_KINDS.filter((kind) => KEYWORDS[kind.id].test(trimmed)).map(
    (kind) => kind.id,
  );
}

export function supportKindLabel(kind: SupportKind): string {
  return SUPPORT_KINDS.find((item) => item.id === kind)?.label ?? "Support";
}

export function readableWebsite(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function composeDraftSummary(draft: SupportDraft): string {
  const components = draft.kinds.length
    ? draft.kinds.map(supportKindLabel).join(", ")
    : "Support type not yet selected";
  return [
    "MapAble support enquiry draft — no provider has been contacted.",
    "Location: " + (draft.locality.trim() || "Not set"),
    "Support components: " + components,
    "Frequency: " + draft.frequency.replace("-", " "),
    "Additional search: " + (draft.query.trim() || "None"),
    "Provider availability, eligibility, registration and support suitability are not confirmed.",
  ].join("\n");
}
