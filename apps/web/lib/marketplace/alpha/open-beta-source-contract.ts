/**
 * MapAble Marketplace — proposed open-beta EXTERNAL DATA contract.
 * No external sources are connected and no network calls happen here.
 * Only reviewed, licensed, provenance-bearing records could be published.
 * Public provider registry and map data must NEVER become seller listings.
 */
export type BetaSourceId =
  | "ndis-commission-register"
  | "ndia-market-aggregates"
  | "openstreetmap-places"
  | "consented-supplier-feed";
export type BetaDataKind = "provider-directory" | "market-statistic" | "access-place" | "supplier-offer";
export type BetaSourceReview = "not-reviewed" | "licence-pending" | "approved";
export type BetaEvidenceState = "external-unverified" | "human-reviewed";

export interface BetaSource {
  readonly id: BetaSourceId;
  readonly label: string;
  readonly homepage: string;
  readonly classification: BetaDataKind;
  readonly rights: string;
  readonly rightsStatus: BetaSourceReview;
  readonly supplierApprovalRequired: boolean;
  readonly permittedInCheckout: false;
}

export const BETA_SOURCE_REGISTRY: Readonly<Record<BetaSourceId, BetaSource>> = {
  "ndis-commission-register": {
    id: "ndis-commission-register",
    label: "NDIS Commission Provider Register",
    homepage: "https://www.ndiscommission.gov.au/provider-registration/find-registered-provider",
    classification: "provider-directory",
    rights: "Reuse terms, licensing, freshness and data minimisation require review",
    rightsStatus: "licence-pending",
    supplierApprovalRequired: true,
    permittedInCheckout: false,
  },
  "ndia-market-aggregates": {
    id: "ndia-market-aggregates",
    label: "NDIA public market/provider aggregates",
    homepage: "https://dataresearch.ndis.gov.au/explore-data",
    classification: "market-statistic",
    rights: "Source attribution and individual dataset licence must be checked",
    rightsStatus: "licence-pending",
    supplierApprovalRequired: true,
    permittedInCheckout: false,
  },
  "openstreetmap-places": {
    id: "openstreetmap-places",
    label: "OpenStreetMap accessibility tags",
    homepage: "https://www.openstreetmap.org/copyright",
    classification: "access-place",
    rights: "Open Database License (ODbL); attribution and share-alike obligations",
    rightsStatus: "licence-pending", // per-project licence compliance review still needed
    supplierApprovalRequired: true,
    permittedInCheckout: false,
  },
  "consented-supplier-feed": {
    id: "consented-supplier-feed",
    label: "Opt-in licensed supplier catalogue feed",
    homepage: "https://mapable.com.au", // SOURCE CONCEPT ONLY; not an endpoint
    classification: "supplier-offer",
    rights: "Individual supplier agreement and proof of rights required",
    rightsStatus: "not-reviewed",
    supplierApprovalRequired: true,
    permittedInCheckout: false,
  },
};

export type BetaPhase = "closed-alpha" | "open-beta-readonly";
export interface BetaFlags {
  MAPABLE_MARKETPLACE_OPEN_BETA_ENABLED?: string;
  MAPABLE_MARKETPLACE_EXTERNAL_DATA_ENABLED?: string;
  MAPABLE_MARKETPLACE_BETA_SECURITY_REVIEW_APPROVED?: string;
  MAPABLE_MARKETPLACE_BETA_PRIVACY_REVIEW_APPROVED?: string;
  MAPABLE_MARKETPLACE_BETA_LICENCE_REVIEW_APPROVED?: string;
  MAPABLE_MARKETPLACE_BETA_PUBLISH_APPROVED?: string;
}

/** Independent explicit approvals; all unset defaults to closed-alpha. */
export function resolveBetaPhase(flags: BetaFlags): BetaPhase {
  return flags.MAPABLE_MARKETPLACE_OPEN_BETA_ENABLED === "true" &&
    flags.MAPABLE_MARKETPLACE_EXTERNAL_DATA_ENABLED === "true" &&
    flags.MAPABLE_MARKETPLACE_BETA_SECURITY_REVIEW_APPROVED === "true" &&
    flags.MAPABLE_MARKETPLACE_BETA_PRIVACY_REVIEW_APPROVED === "true" &&
    flags.MAPABLE_MARKETPLACE_BETA_LICENCE_REVIEW_APPROVED === "true" &&
    flags.MAPABLE_MARKETPLACE_BETA_PUBLISH_APPROVED === "true"
      ? "open-beta-readonly" : "closed-alpha";
}

export interface ExternalCandidate {
  readonly source: BetaSourceId;
  readonly sourceRecordId: string;
  readonly title: string;
  readonly sourceUrl: string;
  readonly retrievedAt: string;
  readonly claimedType: BetaDataKind;
  readonly evidenceState: BetaEvidenceState;
  readonly reviewerId?: string;
  readonly reviewDate?: string;
  readonly licenceDecisionId?: string;
  readonly correctionContact?: string;
}

export interface ExternalPublishedListing {
  readonly id: string;
  readonly title: string;
  readonly kind: BetaDataKind;
  readonly externalSource: BetaSourceId;
  readonly sourceUrl: string;
  readonly retrievedAt: string;
  readonly evidenceState: BetaEvidenceState;
  readonly disclaimer: string;
  readonly priceCents: null;
  readonly verifiedSupplier: false;
  readonly canPurchase: false;
}

export interface BetaPublicationReview {
  readonly sourceId: BetaSourceId;
  readonly licenceDecisionId: string;
  readonly reviewedRecordIds: readonly string[];
  readonly allowedDomain: string;
  readonly approvedByHuman: boolean;
  readonly revocationActive: boolean;
  readonly maxAgeDays: number;
}

function validISO(value: string): boolean {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return false;
  const n = Date.parse(value);
  return Number.isFinite(n) && new Date(n).toISOString() === value;
}
function secureRecordUrl(value: string, domain: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname === domain &&
      !parsed.username && !parsed.password && !parsed.hash &&
      !parsed.port && parsed.href.length <= 2048;
  } catch { return false; }
}

/**
 * Normalise human-reviewed external data. Fail CLOSED for absent licence
 * decisions, stale/future data, unrecognised sources and any unverified claims.
 * A row cannot become a commercial offer or paid product through this function.
 * This is an in-memory transformer, NOT a connected data importer.
 */
export function publishExternalReadOnlyCandidate(
  candidate: ExternalCandidate, review: BetaPublicationReview,
  flags: BetaFlags, nowISO: string,
): ExternalPublishedListing {
  if (resolveBetaPhase(flags) !== "open-beta-readonly")
    throw new Error("External read-only publication is disabled.");
  const source = BETA_SOURCE_REGISTRY[candidate.source];
  if (!source || source.id !== review.sourceId ||
    source.classification !== candidate.claimedType)
    throw new Error("The source and record classification do not match.");
  if (!review.approvedByHuman || review.revocationActive ||
      !review.licenceDecisionId || !review.licenceDecisionId.trim() ||
      candidate.licenceDecisionId !== review.licenceDecisionId)
    throw new Error("Source rights review not approved.");
  if (candidate.evidenceState !== "human-reviewed" ||
      !candidate.reviewerId || !candidate.reviewDate ||
      !review.reviewedRecordIds.includes(candidate.sourceRecordId))
    throw new Error("An individual human-reviewed record is required.");
  if (!/^[A-Za-z0-9:_-]{1,150}$/.test(candidate.sourceRecordId) ||
      candidate.title.trim().length < 3 || candidate.title.length > 180 ||
      /[\u0000-\u001F]/.test(candidate.title))
    throw new Error("Invalid source record information.");
  if (!secureRecordUrl(candidate.sourceUrl, review.allowedDomain))
    throw new Error("Unexpected source URL or domain.");
  if (!validISO(candidate.retrievedAt) || !validISO(candidate.reviewDate) ||
      !validISO(nowISO) || !Number.isInteger(review.maxAgeDays) ||
      review.maxAgeDays < 1 || review.maxAgeDays > 30)
    throw new Error("Invalid retrieval or review date.");
  const now = Date.parse(nowISO);
  const fetched = Date.parse(candidate.retrievedAt);
  const reviewed = Date.parse(candidate.reviewDate);
  if (fetched > now || reviewed > now ||
      now - fetched > review.maxAgeDays * 86_400_000 ||
      now - reviewed > review.maxAgeDays * 86_400_000)
    throw new Error("External data is stale or dated in the future.");
  // A provider directory, map record or vendor feed is only an evidence record.
  // NEVER present a directory entry as approved for selling or purchases.
  return {
    id: "external:" + candidate.source + ":" + candidate.sourceRecordId,
    title: candidate.title.trim(),
    kind: candidate.claimedType,
    externalSource: candidate.source,
    sourceUrl: candidate.sourceUrl,
    retrievedAt: candidate.retrievedAt,
    evidenceState: candidate.evidenceState,
    disclaimer: "Externally sourced, source-date shown. No supplier suitability, " +
      "NDIS registration currency, medical-device safety, stock or funding guarantee.",
    priceCents: null, verifiedSupplier: false, canPurchase: false,
  };
}

/** Both lists empty until a separately reviewed, audited source-ingestion PR. */
export const BETA_CONNECTED_ADAPTERS: readonly BetaSourceId[] = [];
export const BETA_PUBLISHED_RECORDS: readonly ExternalPublishedListing[] = [];
