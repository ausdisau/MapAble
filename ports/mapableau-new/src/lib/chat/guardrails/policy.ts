/**
 * NDIS Quality & Safeguarding policy pack for mapableau-new.
 *
 * Ported from REPL server/chat-guardrails.ts (POLICY_PACK constant) and
 * server/policy-pack/mapable-quality-safeguarding.json.
 *
 * In mapableau-new, place the JSON file at:
 *   src/lib/chat/guardrails/mapable-quality-safeguarding.json
 * and it will be merged over this default at module load time.
 */

const DEFAULT_POLICY_PACK = {
  version: "mapable-quality-safeguarding-v3+ndis-policies-v2.1",
  refs: {
    quality: "Quality & Safeguarding Policy v3",
    incidents:
      "SOP — Incident Management & Reportable Incidents; NDIS Policies v2.1 Incident Management",
    complaints:
      "SOP — Feedback & Complaints; NDIS Policies v2.1 Feedback & Complaints",
    privacy:
      "Privacy, Information & Records; NDIS Policies v2.1 Information Privacy & Security",
    retention: "Records Retention Schedule",
  },
  principles: [
    "Rights first — dignity, privacy, choice and control.",
    "Safety — zero tolerance for abuse, neglect, exploitation or discrimination; act immediately to make people safe.",
    "Openness — welcome feedback and complaints; respond promptly and fairly.",
    "Accessibility — multiple ways to contact MapAble; Easy Read and interpreters on request.",
    "Support the person first, then record, report and learn.",
  ],
  contacts: {
    emergency: "000",
    ndisCommission: "1800 035 544",
    lifeline: "13 11 14",
  },
  retentionYears: 7,
} as const;

export type PolicyPack = typeof DEFAULT_POLICY_PACK;

function loadPolicyPack(): PolicyPack {
  // In Next.js App Router, fs.readFileSync is available in Node runtime only.
  // The JSON override is intentionally optional — the hardcoded default is
  // always complete and policy-compliant.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const override = require("./mapable-quality-safeguarding.json");
    return { ...DEFAULT_POLICY_PACK, ...override };
  } catch {
    return DEFAULT_POLICY_PACK;
  }
}

export const POLICY_PACK = loadPolicyPack();
