import { prisma } from "@/lib/prisma";

export type BehavioralRiskBand =
  | "stable"
  | "elevated"
  | "high"
  | "critical";

export type BehavioralRiskSignal = {
  key: string;
  weight: number;
  matched: boolean;
  description: string;
};

export type BehavioralRiskResult = {
  participantId: string;
  score: number;
  band: BehavioralRiskBand;
  drivers: string[];
  signals: BehavioralRiskSignal[];
  trend: number[];
  authorityCeiling: "ADVISORY_ONLY";
  requiresHumanConfirmation: true;
  actionTaken: false;
  notice: string;
};

const CRITICAL_TERMS = [
  "self-harm",
  "self harm",
  "suicide",
  "assault",
  "abuse",
  "abscond",
];
const ELEVATED_TERMS = [
  "missed shift",
  "worker turnover",
  "routine disruption",
  "sensory overload",
  "meltdown",
  "distress",
  "placement breakdown",
];

function bandForScore(score: number): BehavioralRiskBand {
  if (score >= 9) return "critical";
  if (score >= 7) return "high";
  if (score >= 4) return "elevated";
  return "stable";
}

/**
 * Deterministic advisory risk index (1–10). Never auto-escalates.
 */
export async function calculateBehavioralRiskIndex(
  participantId: string
): Promise<BehavioralRiskResult> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [incidents, notes] = await Promise.all([
    prisma.incidentReport.findMany({
      where: {
        participantId,
        createdAt: { gte: since },
      },
      select: {
        id: true,
        severity: true,
        description: true,
        immediateRiskPresent: true,
        safeguardingConcern: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
    prisma.careProgressNote.findMany({
      where: {
        careServiceLog: { participantId },
        createdAt: { gte: since },
      },
      select: { body: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  const corpus = [
    ...incidents.map((i) => i.description ?? ""),
    ...notes.map((n) => n.body ?? ""),
  ]
    .join(" ")
    .toLowerCase();

  const signals: BehavioralRiskSignal[] = [
    {
      key: "incident_count_high",
      weight: 2,
      matched: incidents.length >= 3,
      description: "Three or more incidents in 30 days",
    },
    {
      key: "immediate_risk",
      weight: 3,
      matched: incidents.some((i) => i.immediateRiskPresent),
      description: "Immediate risk flagged on an incident",
    },
    {
      key: "safeguarding_concern",
      weight: 2,
      matched: incidents.some((i) => i.safeguardingConcern),
      description: "Safeguarding concern recorded",
    },
    {
      key: "critical_language",
      weight: 3,
      matched: CRITICAL_TERMS.some((t) => corpus.includes(t)),
      description: "Critical distress language in notes/incidents",
    },
    {
      key: "elevated_language",
      weight: 1,
      matched: ELEVATED_TERMS.some((t) => corpus.includes(t)),
      description: "Elevated disruption / overload language",
    },
    {
      key: "worker_turnover_language",
      weight: 1,
      matched: corpus.includes("worker turnover") || corpus.includes("new worker"),
      description: "Worker turnover spike language",
    },
  ];

  const raw = signals
    .filter((s) => s.matched)
    .reduce((sum, s) => sum + s.weight, 0);
  const score = Math.min(10, Math.max(1, 1 + raw));

  const drivers: string[] = [];
  if (incidents.length >= 3) drivers.push("Frequent routine disruption");
  if (corpus.includes("worker turnover") || corpus.includes("new worker")) {
    drivers.push("Worker turnover spike");
  }
  if (corpus.includes("sensory overload") || corpus.includes("meltdown")) {
    drivers.push("Sensory overload incidents");
  }
  if (incidents.some((i) => i.immediateRiskPresent || i.safeguardingConcern)) {
    drivers.push("Safeguarding / immediate risk flags");
  }
  if (drivers.length === 0 && score >= 4) {
    drivers.push("Elevated multi-signal pattern");
  }
  if (drivers.length === 0) drivers.push("Stable — no escalation drivers matched");

  // Simple trend: cumulative matched-weight snapshots by incident order
  const trend: number[] = [];
  let running = 1;
  for (const incident of incidents) {
    const text = (incident.description ?? "").toLowerCase();
    if (incident.immediateRiskPresent) running += 1;
    if (CRITICAL_TERMS.some((t) => text.includes(t))) running += 1;
    trend.push(Math.min(10, running));
  }
  if (trend.length === 0) trend.push(score);

  return {
    participantId,
    score,
    band: bandForScore(score),
    drivers,
    signals,
    trend,
    authorityCeiling: "ADVISORY_ONLY",
    requiresHumanConfirmation: true,
    actionTaken: false,
    notice:
      "Advisory behavioral risk scaffold only. Human confirmation required. Never auto-escalates or creates cases.",
  };
}
