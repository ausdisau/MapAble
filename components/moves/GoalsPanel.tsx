import type { RehabilitationGoal, RehabilitationPlanStatus } from "@prisma/client";

type GoalSummary = Pick<RehabilitationGoal, "id" | "title" | "status">;

interface GoalsPanelProps {
  goals: GoalSummary[];
}

export function GoalsPanel({ goals }: GoalsPanelProps) {
  if (goals.length === 0) {
    return (
      <section aria-labelledby="moves-goals-heading" className="rounded-xl border p-4">
        <h2 id="moves-goals-heading" className="font-heading text-lg font-semibold">
          Your goals
        </h2>
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          No active goals yet. Your clinician will add goals to your rehabilitation plan.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="moves-goals-heading" className="rounded-xl border p-4">
      <h2 id="moves-goals-heading" className="font-heading text-lg font-semibold">
        Your goals
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Participant-defined outcomes coordinated with your clinician. Goals are not medical
        diagnoses.
      </p>
      <ul className="mt-4 space-y-2" aria-label="Rehabilitation goals">
        {goals.map((goal) => (
          <li
            key={goal.id}
            className="flex items-start justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2"
          >
            <span>{goal.title}</span>
            <span className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
              {goal.status}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PlanStatusBadge({ status }: { status: RehabilitationPlanStatus }) {
  return (
    <span
      className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium uppercase tracking-wide"
      aria-label={`Plan status: ${status}`}
    >
      {status}
    </span>
  );
}
