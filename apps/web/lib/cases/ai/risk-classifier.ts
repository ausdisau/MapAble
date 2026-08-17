import type { CaseRiskLevel } from "@prisma/client";

import type { AIRiskAssessment, CaseSnapshot } from "./types";

/**
 * Deterministic, transparent risk classifier.
 *
 * Each signal contributes a fixed weight and the resulting score is mapped
 * to a risk band. We expose `signals` so reviewers can see *why* a score
 * was given. The classifier never auto-escalates — it only suggests a
 * level for a human to confirm.
 */

interface Signal {
  key: string;
  weight: number;
  matched: boolean;
  description: string;
}

const CRITICAL_TERMS = [
  "suicide",
  "self-harm",
  "self harm",
  "abuse",
  "assault",
  "violent",
  "homeless tonight",
  "no shelter",
  "overdose",
  "psychotic",
];

const ELEVATED_TERMS = [
  "missed medication",
  "missed appointment",
  "no carer",
  "no support worker",
  "evicted",
  "missed shift",
  "running out",
  "emergency",
  "ambulance",
  "police",
  "hospital",
];

const MODERATE_TERMS = [
  "anxious",
  "anxiety",
  "depressed",
  "isolated",
  "complaint",
  "delayed",
  "behind",
  "stressed",
  "transport issue",
];

function corpusFromCase(snapshot: CaseSnapshot): string {
  const parts: string[] = [
    snapshot.title,
    snapshot.description,
    ...snapshot.notes.map((n) => n.body),
    ...snapshot.tasks.map((t) => t.title),
  ];
  return parts.join(" \n ").toLowerCase();
}

function matchesAny(corpus: string, terms: string[]): string[] {
  const hits: string[] = [];
  for (const term of terms) {
    if (corpus.includes(term)) hits.push(term);
  }
  return hits;
}

function scoreToLevel(score: number): CaseRiskLevel {
  if (score >= 0.85) return "critical";
  if (score >= 0.6) return "high";
  if (score >= 0.4) return "elevated";
  if (score >= 0.2) return "moderate";
  return "low";
}

export function classifyRisk(snapshot: CaseSnapshot): AIRiskAssessment {
  const corpus = corpusFromCase(snapshot);
  const signals: Signal[] = [];

  const criticalHits = matchesAny(corpus, CRITICAL_TERMS);
  signals.push({
    key: "critical_language",
    weight: 0.5,
    matched: criticalHits.length > 0,
    description: criticalHits.length
      ? `Critical-risk language detected: ${criticalHits.join(", ")}`
      : "No critical-risk language detected",
  });

  const elevatedHits = matchesAny(corpus, ELEVATED_TERMS);
  signals.push({
    key: "elevated_language",
    weight: 0.25,
    matched: elevatedHits.length > 0,
    description: elevatedHits.length
      ? `Elevated-risk language detected: ${elevatedHits.join(", ")}`
      : "No elevated-risk language detected",
  });

  const moderateHits = matchesAny(corpus, MODERATE_TERMS);
  signals.push({
    key: "moderate_language",
    weight: 0.1,
    matched: moderateHits.length > 0,
    description: moderateHits.length
      ? `Moderate-risk language detected: ${moderateHits.join(", ")}`
      : "No moderate-risk language detected",
  });

  const overdueTasks = snapshot.tasks.filter(
    (t) =>
      t.status !== "done" &&
      t.status !== "cancelled" &&
      t.dueAt !== null &&
      t.dueAt.getTime() < Date.now(),
  );
  signals.push({
    key: "overdue_tasks",
    weight: Math.min(overdueTasks.length * 0.1, 0.3),
    matched: overdueTasks.length > 0,
    description:
      overdueTasks.length > 0
        ? `${overdueTasks.length} overdue task(s)`
        : "No overdue tasks",
  });

  signals.push({
    key: "explicit_priority",
    weight:
      snapshot.priority === "urgent"
        ? 0.25
        : snapshot.priority === "high"
          ? 0.15
          : 0,
    matched: snapshot.priority === "urgent" || snapshot.priority === "high",
    description: `Case priority is ${snapshot.priority}`,
  });

  signals.push({
    key: "safeguarding_category",
    weight: snapshot.category === "safeguarding" ? 0.2 : 0,
    matched: snapshot.category === "safeguarding",
    description:
      snapshot.category === "safeguarding"
        ? "Case is categorised as safeguarding"
        : `Category is ${snapshot.category}`,
  });

  const score = signals
    .filter((s) => s.matched)
    .reduce((sum, s) => sum + s.weight, 0);
  const clamped = Math.min(Math.max(score, 0), 1);
  const level = scoreToLevel(clamped);

  return {
    level,
    score: Number(clamped.toFixed(3)),
    signals: signals.filter((s) => s.matched).map((s) => s.description),
    rationale: buildRationale(level, signals),
  };
}

function buildRationale(level: CaseRiskLevel, signals: Signal[]): string {
  const matched = signals.filter((s) => s.matched);
  if (matched.length === 0) {
    return "No risk signals matched. AI engine suggests a low risk band; a human should still confirm.";
  }
  const top = matched
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((s) => s.description)
    .join("; ");
  return `Suggested ${level} risk based on: ${top}. AI is advisory only — confirm before escalating.`;
}
