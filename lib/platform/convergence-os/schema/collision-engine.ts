import type {
  CollisionFinding,
  SchemaRefFixture,
} from "@/lib/platform/convergence-os/types";

/** Indoor models present on current main that stale tips often omit/delete. */
export const MAIN_INDOOR_MODELS = [
  "AccessFloorPlan",
  "AccessibilityPreferenceProfile",
  "FloorPlanCorrectionProposal",
  "IndoorAccessibilityIncident",
  "IndoorCheckpoint",
  "PartnerApiClient",
  "VisitPlan",
  "VisitPlanShare",
] as const;

/**
 * Fixture schema refs for pilot collision analysis (Wave 3).
 * Derived from verified branch model diffs — not live git in unit tests.
 */
export const SCHEMA_REF_FIXTURES: SchemaRefFixture[] = [
  {
    refLabel: "main",
    refName: "origin/main",
    modelNames: [
      "User",
      "Organisation",
      "AccessPlace",
      "AccessiblePlace",
      "AccessFloorPlan",
      "AccessibilityPreferenceProfile",
      "FloorPlanCorrectionProposal",
      "IndoorAccessibilityIncident",
      "IndoorCheckpoint",
      "PartnerApiClient",
      "VisitPlan",
      "VisitPlanShare",
      "Case",
      "TransportTrip",
      "TransportBooking",
      "CareShift",
      "ConsentRecord",
      "AuditEvent",
      "Invoice",
      "BillingInvoice",
      "NdisInvoice",
      "ParticipantFundingSource",
      "BillingFundingSource",
      "PersonalDataVaultRequest",
    ],
    migrationDirs: [
      "20260716120000_indoor_accessibility_platform",
      "20260626120000_payout_ledger",
    ],
  },
  {
    refLabel: "vault",
    refName: "cursor/personal-access-vault-registry-77ea",
    modelNames: [
      "PersonalVault",
      "VaultItem",
      "VaultDevice",
      "VaultExport",
      "VaultCapability",
    ],
    migrationDirs: ["20260716140000_personal_access_vault"],
  },
  {
    refLabel: "rightsos",
    refName: "cursor/rightsos-purpose-registry-shadow-aa10",
    modelNames: [
      "RightsPurpose",
      "RightsPolicyDecision",
      "PersonalVault",
      "PersonalVaultItem",
      "VaultDevice",
      "VaultExport",
      "AccessCapsule",
    ],
    migrationDirs: ["20260716130000_rightsos_registry"],
  },
  {
    refLabel: "careos",
    refName: "agent/careos-platform-completion",
    modelNames: [
      "CareOSMission",
      "CareOSMissionEvent",
      "CloudEventOutbox",
      "CareOSHumanReview",
    ],
    migrationDirs: [],
  },
  {
    refLabel: "aura",
    refName: "cursor/mapable-aura-wave7-10-6ea8",
    modelNames: [
      "CareOSMission",
      "CareOSMissionEvent",
      "AuraActionProposal",
      "AuraExecutionApproval",
      "AuraExecutionReceipt",
      "AiAccessPlace",
      "AiAccessPassport",
    ],
    migrationDirs: [
      "20260716200000_mapable_aura_wave1",
      "20260716210000_mapable_aura_wave2",
      "20260716220000_mapable_aura_wave3",
      "20260716230000_mapable_aura_wave4",
    ],
  },
  {
    refLabel: "continuity",
    refName: "cursor/continuity-os-life-event-registry-9cd2",
    modelNames: [
      "CareOSMission",
      "CareOSMissionEvent",
      "LifeEventMissionExtension",
      "RecoveryCase",
    ],
    migrationDirs: ["20260716210000_continuity_os_foundation"],
  },
  {
    refLabel: "civic",
    refName: "cursor/civic-asset-registry-static-projection-585f",
    modelNames: ["CivicAsset", "CivicAssetVersion", "CivicSource"],
    migrationDirs: ["20260716160000_civic_asset_registry"],
  },
  {
    refLabel: "a11yops",
    refName: "cursor/accessibility-ops-asset-registry-4343",
    modelNames: [
      "AccessibilityAsset",
      "AccessibilityRule",
      "AccessibilityShadowEvaluation",
    ],
    migrationDirs: ["20260716140000_accessibility_ops_registry"],
  },
  {
    refLabel: "transport_mvp",
    refName: "cursor/mapable-transport-mvp-c42d",
    modelNames: ["TransportTrip", "TransportBooking"],
    migrationDirs: ["20260716140000_transport_mvp_domain"],
  },
];

function modelsAddedVsMain(ref: SchemaRefFixture, main: SchemaRefFixture): string[] {
  const mainSet = new Set(main.modelNames);
  return ref.modelNames.filter((m) => !mainSet.has(m));
}

function findMultiOwnerModels(
  refs: SchemaRefFixture[],
  main: SchemaRefFixture
): Map<string, string[]> {
  const owners = new Map<string, string[]>();
  for (const ref of refs) {
    if (ref.refLabel === "main") continue;
    for (const model of modelsAddedVsMain(ref, main)) {
      const list = owners.get(model) ?? [];
      list.push(ref.refLabel);
      owners.set(model, list);
    }
  }
  return owners;
}

function migrationTimestamp(dir: string): string {
  return dir.split("_")[0] ?? dir;
}

/**
 * Deterministic schema/migration collision analysis.
 * Distinguishes identical names, multi-writer duplicates, and related projections.
 */
export function analyseSchemaCollisions(
  refs: SchemaRefFixture[] = SCHEMA_REF_FIXTURES
): CollisionFinding[] {
  const main = refs.find((r) => r.refLabel === "main");
  if (!main) {
    throw new Error("Schema fixtures require a main ref");
  }

  const findings: CollisionFinding[] = [];
  const multi = findMultiOwnerModels(refs, main);

  for (const [model, owners] of multi) {
    if (owners.length < 2) continue;
    const isCareOs = model.startsWith("CareOSMission");
    findings.push({
      collisionKey: `multi_writer_${model}`,
      severity: isCareOs ? "critical" : "high",
      category: "duplicate_canonical_writer",
      title: `${model} added by multiple branches: ${owners.join(", ")}`,
      affectedModels: [model],
      affectedBranches: owners,
      exactDifference: `Model ${model} appears as an additive definition on: ${owners.join(", ")}`,
      semanticInterpretation: isCareOs
        ? "Same mission SoR concept redefined on CareOS, AURA, and/or Continuity tips"
        : "Name collision across sibling programme branches",
      canonicalRecommendation: isCareOs
        ? "CareOSMission canonical owner = PR #252 (CareOS platform completion). AURA and Continuity must rebase to extension-only."
        : "Human ADR required before merge",
      migrationStrategy: isCareOs
        ? "Land #252 first (rebased on main with indoor preserved); strip CareOSMission DDL from AURA/Continuity"
        : "Merge one writer; convert others to FK/projection/adapter",
      dataPreservationRisk: "Split-brain writes if both land",
      rollbackNotes: "Revert losing migration; keep adapter read path",
      manualDecisionRequired: true,
      evidenceJson: { owners, model },
    });
  }

  // Vault dual-define (PersonalVault on vault + rightsos)
  if (multi.get("PersonalVault")?.length) {
    findings.push({
      collisionKey: "vault_rightsos_personal_vault",
      severity: "critical",
      category: "duplicate_canonical_writer",
      title: "PersonalVault dual-defined by Vault #281 and RightsOS #280",
      affectedModels: ["PersonalVault", "VaultDevice", "VaultExport"],
      affectedBranches: ["vault", "rightsos"],
      exactDifference:
        "Both branches introduce PersonalVault/VaultDevice/VaultExport families",
      semanticInterpretation:
        "RightsOS embedded a partial vault instead of referencing Personal Access Vault",
      canonicalRecommendation:
        "Vault SoR = PR #281. RightsOS must drop vault DDL and depend on Vault APIs.",
      migrationStrategy: "Merge #281 before #280; rebase RightsOS without vault tables",
      dataPreservationRisk: "Dual tables would fork participant vault data",
      rollbackNotes: "Keep #281 tables; delete RightsOS vault tables before merge",
      manualDecisionRequired: true,
    });
  }

  // Migration timestamp collisions
  const tsOwners = new Map<string, { ref: string; dir: string }[]>();
  for (const ref of refs) {
    if (ref.refLabel === "main") continue;
    for (const dir of ref.migrationDirs) {
      const ts = migrationTimestamp(dir);
      const list = tsOwners.get(ts) ?? [];
      list.push({ ref: ref.refLabel, dir });
      tsOwners.set(ts, list);
    }
  }
  for (const [ts, entries] of tsOwners) {
    const uniqueRefs = new Set(entries.map((e) => e.ref));
    if (uniqueRefs.size < 2) continue;
    findings.push({
      collisionKey: `migration_ts_${ts}`,
      severity: "critical",
      category: "migration_timestamp_collision",
      title: `Migration timestamp ${ts} used by multiple branches`,
      affectedBranches: [...uniqueRefs],
      exactDifference: entries.map((e) => `${e.ref}: ${e.dir}`).join("; "),
      semanticInterpretation:
        "Prisma migration directories sharing a timestamp prefix cannot coexist after merge",
      canonicalRecommendation: "Renumber migrations to unique timestamps before merge",
      migrationStrategy: "Assign new YYYYMMDDHHMMSS prefixes per surviving branch",
      dataPreservationRisk: "migrate deploy may skip or fail unpredictably",
      rollbackNotes: "Keep unmerged migrations; renumber on rebase",
      manualDecisionRequired: true,
      evidenceJson: { timestamp: ts, entries },
    });
  }

  // Indoor deletion hazard
  for (const ref of refs) {
    if (ref.refLabel === "main") continue;
    const missingIndoor = MAIN_INDOOR_MODELS.filter(
      (m) => !ref.modelNames.includes(m) && main.modelNames.includes(m)
    );
    // Only flag refs that are full schema tips known to drop indoor (aura/careos/rightsos)
    if (
      missingIndoor.length >= 4 &&
      ["aura", "careos", "rightsos", "continuity"].includes(ref.refLabel)
    ) {
      findings.push({
        collisionKey: `indoor_deletion_${ref.refLabel}`,
        severity: "critical",
        category: "stale_base_indoor_deletion",
        title: `${ref.refName} is missing main indoor models`,
        affectedModels: [...missingIndoor],
        affectedBranches: [ref.refLabel],
        exactDifference: `Missing vs main: ${missingIndoor.join(", ")}`,
        semanticInterpretation:
          "Stale tip forked before indoor landed or rewrote schema without indoor tables",
        canonicalRecommendation:
          "Rebase onto current main preserving AccessFloorPlan family before any merge",
        migrationStrategy: "git rebase origin/main; resolve schema keeping indoor models",
        dataPreservationRisk: "Merge without rebase can destroy indoor platform tables",
        rollbackNotes: "Block merge until indoor models restored in tip schema",
        manualDecisionRequired: true,
      });
    }
  }

  // CivicAsset vs AccessibilityAsset — related projections, not automatic duplicates
  const civic = refs.find((r) => r.refLabel === "civic");
  const a11y = refs.find((r) => r.refLabel === "a11yops");
  if (civic && a11y) {
    findings.push({
      collisionKey: "asset_related_projection_civic_a11yops",
      severity: "warning",
      category: "related_projection",
      title: "CivicAsset vs AccessibilityAsset — similar names, distinct domains",
      affectedModels: ["CivicAsset", "AccessibilityAsset"],
      affectedBranches: ["civic", "a11yops"],
      exactDifference:
        "CivicAsset = civic place twin registry; AccessibilityAsset = ops asset/rule graph",
      semanticInterpretation:
        "Not semantic duplicates; both should FK/bind to AccessPlace rather than redefine place SoR",
      canonicalRecommendation:
        "Keep both; require AccessPlace binding rules; merge Civic (#284) before AccessibilityOps (#282)",
      migrationStrategy: "Additive parallel tables with shared place reference convention",
      dataPreservationRisk: "Low if place SoR remains AccessPlace",
      rollbackNotes: "Independent table drop per programme",
      manualDecisionRequired: true,
    });
  }

  // AccessPlace vs AiAccessPlace
  if (multi.has("AiAccessPlace") || refs.some((r) => r.modelNames.includes("AiAccessPlace"))) {
    findings.push({
      collisionKey: "place_sor_ai_access_place",
      severity: "high",
      category: "duplicate_place_sor",
      title: "AiAccessPlace forks AccessPlace source of truth",
      affectedModels: ["AccessPlace", "AiAccessPlace"],
      affectedBranches: refs
        .filter((r) => r.modelNames.includes("AiAccessPlace"))
        .map((r) => r.refLabel),
      exactDifference: "AI/AURA stack introduces AiAccessPlace parallel to AccessPlace",
      semanticInterpretation: "Second place writer would split civic/access identity",
      canonicalRecommendation:
        "AccessPlace remains canonical; fold AiAccess* as extensions/projections",
      migrationStrategy: "Rebuild AI base on main; map AiAccessPlace → AccessPlace + extension",
      dataPreservationRisk: "High if both receive writes",
      rollbackNotes: "Keep AccessPlace; retire AiAccessPlace writes",
      manualDecisionRequired: true,
    });
  }

  // TransportTrip vs TransportBooking (on main — behavioural)
  findings.push({
    collisionKey: "transport_trip_vs_booking",
    severity: "warning",
    category: "legacy_parallel",
    title: "TransportTrip canonical vs TransportBooking legacy",
    affectedModels: ["TransportTrip", "TransportBooking"],
    affectedBranches: ["main", "transport_mvp"],
    exactDifference:
      "Both represent accessible ride lifecycle; Trip used by scheduling/evidence; Booking by legacy driver routes and care-transport orchestrator",
    semanticInterpretation: "Legacy parallel with active writers — not automatic delete",
    canonicalRecommendation:
      "TransportTrip canonical. TransportBooking compatibility read adapter. No new writes to TransportBooking after cutover.",
    migrationStrategy:
      "Prefer PR #276 on Trip; treat #283 MVP as rebuild/adapter candidate; migrate driver UI",
    dataPreservationRisk: "Must preserve active booking rows during cutover",
    rollbackNotes: "Retain TransportBooking table until reconciliation complete",
    manualDecisionRequired: true,
  });

  // Case vs CareOSMission — same concept different names
  findings.push({
    collisionKey: "case_vs_careos_mission",
    severity: "high",
    category: "same_concept_different_names",
    title: "Case (main) vs CareOSMission (target) — mission concept",
    affectedModels: ["Case", "CareOSMission"],
    affectedBranches: ["main", "careos", "aura", "continuity"],
    exactDifference:
      "Case is interim SoR on main; CareOSMission is target SoR on #252; CaseMissionAdapter bridges",
    semanticInterpretation: "Projection/adapter path exists; not silent rename",
    canonicalRecommendation:
      "CareOSMission becomes canonical after #252; keep CaseMissionAdapter until cutover; do not delete Case early",
    migrationStrategy: "Adapter writes Case until mission table live; then dual-read; then no_new_writes on Case",
    dataPreservationRisk: "Participant case history must migrate or remain readable",
    rollbackNotes: "Adapter remains until retirement criteria met",
    manualDecisionRequired: true,
  });

  return findings.sort((a, b) => {
    const order = { critical: 0, high: 1, warning: 2, info: 3 };
    return order[a.severity] - order[b.severity];
  });
}

/** Pure helpers used by tests for semantic distinctions. */
export function modelsAreIdentical(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((m) => sb.has(m));
}

export function isRelatedProjectionPair(left: string, right: string): boolean {
  const pairs = [
    ["CivicAsset", "AccessibilityAsset"],
    ["Case", "CareOSMission"],
    ["AccessPlace", "AiAccessPlace"],
    ["TransportTrip", "TransportBooking"],
  ];
  return pairs.some(
    ([x, y]) =>
      (left === x && right === y) || (left === y && right === x)
  );
}
