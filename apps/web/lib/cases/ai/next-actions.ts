import type { AINextAction, CaseSnapshot } from "./types";

/**
 * Generates a small set of suggested next actions. Suggestions follow
 * rules driven by case state and content; nothing here learns from prior
 * cases, which keeps the system explainable and free of training-data
 * drift. Every suggestion is advisory and must be accepted by a human
 * before becoming a real task.
 */
export function nextActions(snapshot: CaseSnapshot): AINextAction[] {
  const out: AINextAction[] = [];
  const now = Date.now();

  const openTasks = snapshot.tasks.filter(
    (t) => t.status !== "done" && t.status !== "cancelled",
  );
  const overdueTasks = openTasks.filter(
    (t) => t.dueAt && t.dueAt.getTime() < now,
  );
  const corpus = [
    snapshot.title,
    snapshot.description,
    ...snapshot.notes.map((n) => n.body),
  ]
    .join(" ")
    .toLowerCase();

  if (snapshot.notes.length === 0) {
    out.push({
      title: "Add an intake note describing the participant context",
      reason:
        "Case has no notes yet; capturing baseline context unblocks downstream coordination.",
      priority: "medium",
      dueInDays: 2,
    });
  }

  if (overdueTasks.length > 0) {
    out.push({
      title: `Review ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""}`,
      reason:
        "One or more tasks have a due date in the past. Decide if they should be re-scoped, closed, or reassigned.",
      priority: overdueTasks.length > 2 ? "high" : "medium",
      dueInDays: 1,
    });
  }

  if (!snapshot.assignedToId) {
    out.push({
      title: "Assign a case owner",
      reason:
        "No coordinator is currently assigned. Cases without an owner risk drift.",
      priority: "medium",
      dueInDays: 3,
    });
  }

  if (
    snapshot.priority === "urgent" ||
    snapshot.riskLevel === "high" ||
    snapshot.riskLevel === "critical"
  ) {
    out.push({
      title: "Schedule a wellbeing check-in within 24 hours",
      reason:
        "Case priority or AI-suggested risk level is elevated. Confirm participant safety and current supports.",
      priority: "urgent",
      dueInDays: 1,
    });
  }

  if (
    corpus.includes("funding") ||
    corpus.includes("budget") ||
    corpus.includes("plan review")
  ) {
    out.push({
      title: "Cross-check current NDIS plan budget and remaining funds",
      reason:
        "Case content references funding. A budget snapshot will inform next steps.",
      priority: "medium",
      dueInDays: 5,
    });
  }

  if (corpus.includes("transport") || corpus.includes("getting to")) {
    out.push({
      title: "Confirm transport plan is in place",
      reason: "Case content references transport needs.",
      priority: "medium",
      dueInDays: 4,
    });
  }

  if (
    corpus.includes("housing") ||
    corpus.includes("eviction") ||
    corpus.includes("homeless")
  ) {
    out.push({
      title: "Engage housing support services",
      reason:
        "Case content references housing risk; specialist support may be required.",
      priority: "high",
      dueInDays: 2,
    });
  }

  if (snapshot.status === "open" && snapshot.dueAt === null) {
    out.push({
      title: "Set a review or follow-up date for the case",
      reason: "Open cases without a review date often go stale.",
      priority: "low",
      dueInDays: 7,
    });
  }

  return dedupe(out).slice(0, 5);
}

function dedupe(actions: AINextAction[]): AINextAction[] {
  const seen = new Set<string>();
  const out: AINextAction[] = [];
  for (const action of actions) {
    const key = action.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(action);
  }
  return out;
}
