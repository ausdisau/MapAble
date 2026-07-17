/**
 * Public-claim registry — marketing / UI copy must not exceed maturity evidence.
 * Feature flags and documentation alone are never production evidence.
 */

export type PublicClaimMaturity =
  | "concept"
  | "scaffold"
  | "synthetic_demo"
  | "shadow"
  | "internal_alpha"
  | "controlled_pilot"
  | "limited_release"
  | "production_ready"
  | "generally_available"
  | "suspended"
  | "retired";

export type PublicClaimEntry = {
  claimKey: string;
  surface: string;
  capabilityKey: string;
  currentMaturity: PublicClaimMaturity;
  publicClaimAllowed: boolean;
  prohibitedWording: string[];
  allowedWording: string[];
  evidenceRequired: string[];
  sourceOnMain: boolean;
  notes: string;
};

export const PUBLIC_CLAIM_REGISTRY: PublicClaimEntry[] = [
  {
    claimKey: "claim.living_access_fabric_live",
    surface: "marketing / AI Next",
    capabilityKey: "access.intelligence_next",
    currentMaturity: "synthetic_demo",
    publicClaimAllowed: false,
    prohibitedWording: [
      "live accessibility truth",
      "guaranteed accessible route",
      "production Living Access Fabric",
    ],
    allowedWording: [
      "synthetic Harbour demo",
      "shadow evaluation",
      "unknown evidence remains unknown",
    ],
    evidenceRequired: [
      "durable persistence",
      "tenant isolation tests",
      "controlled_pilot exit",
    ],
    sourceOnMain: true,
    notes: "AI Next on main is synthetic/shadow — not personally usable truth.",
  },
  {
    claimKey: "claim.ndia_live_submission",
    surface: "billing / NDIS",
    capabilityKey: "ndis.claim_submission",
    currentMaturity: "scaffold",
    publicClaimAllowed: false,
    prohibitedWording: ["submits to NDIA", "live claiming", "production NDIS gateway"],
    allowedWording: ["funding facade", "adapters disabled", "mock gateway"],
    evidenceRequired: ["formal NDIA authorisation", "production adapter gates"],
    sourceOnMain: false,
    notes: "Real NDIA submission must stay disabled until authorised.",
  },
  {
    claimKey: "claim.transport_guaranteed_arrival",
    surface: "transport",
    capabilityKey: "transport.trip_request",
    currentMaturity: "scaffold",
    publicClaimAllowed: false,
    prohibitedWording: ["guaranteed arrival", "live ETA production"],
    allowedWording: ["route estimate", "request ≠ confirmed trip"],
    evidenceRequired: ["TransportTrip evidence loop", "participant review"],
    sourceOnMain: true,
    notes: "estimate ≠ arrival; completed ≠ outcome.",
  },
  {
    claimKey: "claim.academy_equals_competency",
    surface: "workforce / academy",
    capabilityKey: "workforce.readiness",
    currentMaturity: "controlled_pilot",
    publicClaimAllowed: false,
    prohibitedWording: ["course completion certifies competency", "AI-certified worker"],
    allowedWording: ["completion evidence", "supervised observation required"],
    evidenceRequired: ["evidence exchange contract", "human competency verification"],
    sourceOnMain: true,
    notes: "Completion must never equal competency. Readiness package on main (#314).",
  },
  {
    claimKey: "claim.auto_worker_assignment",
    surface: "workforce",
    capabilityKey: "workforce.readiness",
    currentMaturity: "controlled_pilot",
    publicClaimAllowed: false,
    prohibitedWording: ["automatically assigns workers", "AI ranks workers"],
    allowedWording: ["readiness reasons", "human assignment"],
    evidenceRequired: ["deterministic readiness without auto-assign"],
    sourceOnMain: true,
    notes: "Permanent prohibition on AI/auto assignment.",
  },
  {
    claimKey: "claim.companion_production",
    surface: "mobile",
    capabilityKey: "mobile.companion",
    currentMaturity: "scaffold",
    publicClaimAllowed: false,
    prohibitedWording: ["production Companion app", "secure offline by default"],
    allowedWording: ["foundation scaffold", "contracts only until encrypted store proven"],
    evidenceRequired: ["encrypted local DB", "device revocation", "a11y native APIs"],
    sourceOnMain: true,
    notes: "Expo foundation + APIs on main (#327); not a production Companion claim.",
  },
  {
    claimKey: "claim.billing_xero_live",
    surface: "billing",
    capabilityKey: "billing.centre",
    currentMaturity: "internal_alpha",
    publicClaimAllowed: false,
    prohibitedWording: ["live Xero sync", "automatic claim approval"],
    allowedWording: ["BillingInvoice internal alpha", "reconciliation exceptions"],
    evidenceRequired: ["legacy Invoice migration", "idempotency", "human claim approval"],
    sourceOnMain: true,
    notes: "BillingInvoice on main; Xero/NDIA gates off.",
  },
  {
    claimKey: "claim.provider_ops_live",
    surface: "provider operations",
    capabilityKey: "provider.ops_attention",
    currentMaturity: "controlled_pilot",
    publicClaimAllowed: false,
    prohibitedWording: ["live operations centre", "automated escalation"],
    allowedWording: ["read-only attention projection"],
    evidenceRequired: ["projection tests", "PII minimisation", "deep links to writers"],
    sourceOnMain: true,
    notes: "Read-only projection on main (#327); flag default off. No duplicate writers.",
  },
  {
    claimKey: "claim.transport_quotes_durable",
    surface: "transport",
    capabilityKey: "transport.quotes",
    currentMaturity: "controlled_pilot",
    publicClaimAllowed: false,
    prohibitedWording: [
      "production transport quotes",
      "NDIS funding approved by quote",
      "guaranteed accessible arrival from quote",
    ],
    allowedWording: [
      "versioned transport quote",
      "quote is not funding approval",
      "exact address after acceptance and assignment window",
    ],
    evidenceRequired: [
      "Prisma TransportQuote persistence",
      "tenant isolation tests",
      "staged location disclosure tests",
      "controlled_pilot exit",
    ],
    sourceOnMain: true,
    notes:
      "Prisma TransportQuote + versions; not production_supported; acceptance ≠ provider exact address.",
  },
  {
    claimKey: "claim.starting_work_live",
    surface: "pilot",
    capabilityKey: "pilot.starting_work",
    currentMaturity: "synthetic_demo",
    publicClaimAllowed: false,
    prohibitedWording: [
      "live Starting Work journey",
      "production golden journey",
      "guaranteed workplace access",
    ],
    allowedWording: ["synthetic Harbour Starting Work pilot", "controlled pilot fixtures"],
    evidenceRequired: [
      "database-backed journey integration",
      "participant review",
      "recovery receipt",
    ],
    sourceOnMain: true,
    notes: "Synthetic pilot on main; DB-backed journey is programme PR 4.",
  },
  {
    claimKey: "claim.managed_support_registered",
    surface: "strategy / marketing",
    capabilityKey: "managed.support_delivery",
    currentMaturity: "concept",
    publicClaimAllowed: false,
    prohibitedWording: [
      "MapAble is an NDIS-registered",
      "MapAble Managed Support is live",
      "MapAble employs your support workers",
    ],
    allowedWording: [
      "Network facilitation",
      "Managed Support requires separate registration",
      "partner registered providers",
    ],
    evidenceRequired: [
      "NDIS registration evidence",
      "insurance and supervision capacity",
      "operating lane packaging",
    ],
    sourceOnMain: true,
    notes: "Lane 3 blocked by registration — never fabricate.",
  },
  {
    claimKey: "claim.aura_decides",
    surface: "AURA",
    capabilityKey: "aura.mission_planning",
    currentMaturity: "concept",
    publicClaimAllowed: false,
    prohibitedWording: [
      "AURA approves payments",
      "AURA assigns workers",
      "AURA closes safeguarding",
    ],
    allowedWording: ["explains", "drafts", "proposes (L≤3)"],
    evidenceRequired: ["L3 ceiling enforced", "deterministic authority services"],
    sourceOnMain: false,
    notes: "lib/aura absent on main; stacked PRs only.",
  },
  {
    claimKey: "claim.route_personally_safe",
    surface: "indoor / AccessOps",
    capabilityKey: "access.indoor_floor_plan",
    currentMaturity: "scaffold",
    publicClaimAllowed: false,
    prohibitedWording: ["route is safe", "venue confirmed accessible for you"],
    allowedWording: [
      "door-to-room preflight",
      "connected ≠ trusted ≠ current ≠ operational ≠ personally usable",
    ],
    evidenceRequired: ["evidence versioning", "unknown handling", "participant review"],
    sourceOnMain: true,
    notes: "Indoor exists; personal usability claims require evidence.",
  },
];

export function assertNoProductionClaimsWithoutEvidence(): void {
  for (const entry of PUBLIC_CLAIM_REGISTRY) {
    if (
      entry.publicClaimAllowed &&
      entry.currentMaturity !== "production_ready" &&
      entry.currentMaturity !== "generally_available" &&
      entry.currentMaturity !== "limited_release"
    ) {
      throw new Error(
        `Claim ${entry.claimKey} allows public claim at maturity ${entry.currentMaturity}`,
      );
    }
  }
}
