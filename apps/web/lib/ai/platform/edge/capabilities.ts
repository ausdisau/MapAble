import { edgeAiConfig } from "@/lib/config/edge-ai";
import type { WhatChangedEntry } from "@/lib/platform/mission-portfolio";

import { selectProcessingMode } from "./routing";
import type {
  DeviceCapabilitySnapshot,
  EdgeBrokerResult,
  EdgeCapabilityKey,
  ProcessingReceipt,
} from "./types";

export type VisitPackSummaryInput = {
  packId: string;
  passportVersion: number;
  expiresAt: string;
  instructions: Array<{
    id: string;
    mode: string;
    workerFacingWording: string;
    required: boolean;
  }>;
};

function buildReceipt(input: {
  id: string;
  capability: EdgeCapabilityKey;
  mode: ProcessingReceipt["processingMode"];
  dataUsed: string[];
  dataLeftDevice: boolean;
  consentBasis: string;
  outputStatus: ProcessingReceipt["outputStatus"];
  humanReviewRequired: boolean;
  nowIso: string;
}): ProcessingReceipt {
  return {
    id: input.id,
    capability: input.capability,
    processingMode: input.mode,
    model: null,
    modelVersion: null,
    dataUsed: input.dataUsed,
    dataLeftDevice: input.dataLeftDevice,
    retention: "device_local_until_expiry_or_delete",
    consentBasis: input.consentBasis,
    outputStatus: input.outputStatus,
    humanReviewRequired: input.humanReviewRequired,
    createdAtIso: input.nowIso,
    authorityCeiling: "READ_ONLY_EXPLAIN",
    publicAppStoreClaim: false,
  };
}

/**
 * Offline Visit Pack summary — deterministic local function.
 * Never requires an on-device model for essential access.
 */
export function summarizeVisitPackOffline(input: {
  pack: VisitPackSummaryInput;
  device: DeviceCapabilitySnapshot;
  receiptId: string;
  consentBasis: string;
  nowIso?: string;
}): EdgeBrokerResult<{ summary: string; requiredCount: number; expired: boolean }> {
  const now = input.nowIso ?? new Date().toISOString();
  if (!edgeAiConfig.enabled) {
    return {
      value: null,
      equivalentNonAiPathAvailable: true,
      receipt: buildReceipt({
        id: input.receiptId,
        capability: "edge.visit_pack_summary",
        mode: "deterministic_local",
        dataUsed: ["visit_pack_meta"],
        dataLeftDevice: false,
        consentBasis: input.consentBasis,
        outputStatus: "disabled",
        humanReviewRequired: false,
        nowIso: now,
      }),
    };
  }

  const mode = selectProcessingMode({
    device: input.device,
    allowOnDevice: false,
    allowCloud: false,
    requiresModel: false,
  });

  const requiredCount = input.pack.instructions.filter((i) => i.required).length;
  const expired = Date.parse(input.pack.expiresAt) < Date.parse(now);
  const modes = Array.from(
    new Set(input.pack.instructions.map((i) => i.mode))
  ).join(", ");
  const summary = [
    `Visit Pack ${input.pack.packId}`,
    `Passport version ${input.pack.passportVersion}`,
    expired ? "Status: expired — refresh before use" : "Status: current",
    `${requiredCount} required instruction(s)`,
    modes ? `Communication modes: ${modes}` : "No communication modes listed",
    "This summary is local and deterministic. It is not an App Store AI claim.",
  ].join(". ");

  return {
    value: { summary, requiredCount, expired },
    equivalentNonAiPathAvailable: true,
    receipt: buildReceipt({
      id: input.receiptId,
      capability: "edge.visit_pack_summary",
      mode,
      dataUsed: ["visit_pack_instructions", "passport_version", "expiry"],
      dataLeftDevice: false,
      consentBasis: input.consentBasis,
      outputStatus: "ok",
      humanReviewRequired: false,
      nowIso: now,
    }),
  };
}

/**
 * Local What Changed explanation — deterministic over portfolio diffs.
 */
export function explainWhatChangedLocally(input: {
  changes: WhatChangedEntry[];
  device: DeviceCapabilitySnapshot;
  receiptId: string;
  consentBasis: string;
  nowIso?: string;
}): EdgeBrokerResult<{ explanation: string; changeCount: number }> {
  const now = input.nowIso ?? new Date().toISOString();
  if (!edgeAiConfig.enabled) {
    return {
      value: null,
      equivalentNonAiPathAvailable: true,
      receipt: buildReceipt({
        id: input.receiptId,
        capability: "edge.what_changed_explain",
        mode: "deterministic_local",
        dataUsed: ["what_changed_entries"],
        dataLeftDevice: false,
        consentBasis: input.consentBasis,
        outputStatus: "disabled",
        humanReviewRequired: false,
        nowIso: now,
      }),
    };
  }

  const mode = selectProcessingMode({
    device: input.device,
    allowOnDevice: false,
    allowCloud: false,
    requiresModel: false,
  });

  if (input.changes.length === 0) {
    return {
      value: {
        explanation: "Nothing changed in the listed dependencies since the last view.",
        changeCount: 0,
      },
      equivalentNonAiPathAvailable: true,
      receipt: buildReceipt({
        id: input.receiptId,
        capability: "edge.what_changed_explain",
        mode,
        dataUsed: ["what_changed_entries"],
        dataLeftDevice: false,
        consentBasis: input.consentBasis,
        outputStatus: "ok",
        humanReviewRequired: false,
        nowIso: now,
      }),
    };
  }

  const lines = input.changes.map(
    (c) =>
      `${c.label}: ${c.fromState} → ${c.toState} (owner: ${c.responsibleParty})`
  );
  const explanation = [
    `${input.changes.length} change(s) detected.`,
    ...lines,
    "This explanation is deterministic and local. Model rewriting stays optional and flagged off.",
  ].join(" ");

  return {
    value: { explanation, changeCount: input.changes.length },
    equivalentNonAiPathAvailable: true,
    receipt: buildReceipt({
      id: input.receiptId,
      capability: "edge.what_changed_explain",
      mode,
      dataUsed: ["what_changed_entries"],
      dataLeftDevice: false,
      consentBasis: input.consentBasis,
      outputStatus: "ok",
      humanReviewRequired: false,
      nowIso: now,
    }),
  };
}

/** Model-backed edge capabilities abstain to human when flags/device disallow. */
export function routeModelBackedEdgeCapability(input: {
  capability: Exclude<
    EdgeCapabilityKey,
    "edge.visit_pack_summary" | "edge.what_changed_explain"
  >;
  device: DeviceCapabilitySnapshot;
  receiptId: string;
  consentBasis: string;
  nowIso?: string;
}): EdgeBrokerResult<null> {
  const now = input.nowIso ?? new Date().toISOString();
  if (!edgeAiConfig.enabled) {
    return {
      value: null,
      equivalentNonAiPathAvailable: true,
      receipt: buildReceipt({
        id: input.receiptId,
        capability: input.capability,
        mode: "human_assistance",
        dataUsed: [],
        dataLeftDevice: false,
        consentBasis: input.consentBasis,
        outputStatus: "disabled",
        humanReviewRequired: true,
        nowIso: now,
      }),
    };
  }

  const mode = selectProcessingMode({
    device: input.device,
    allowOnDevice: true,
    allowCloud: true,
    requiresModel: true,
  });

  return {
    value: null,
    equivalentNonAiPathAvailable: true,
    receipt: buildReceipt({
      id: input.receiptId,
      capability: input.capability,
      mode,
      dataUsed: [],
      dataLeftDevice: mode === "privacy_disclosed_cloud",
      consentBasis: input.consentBasis,
      outputStatus:
        mode === "human_assistance" ? "human_required" : "abstain",
      humanReviewRequired: true,
      nowIso: now,
    }),
  };
}
