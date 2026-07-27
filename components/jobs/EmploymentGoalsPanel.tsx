import type { EmploymentGoal, EmploymentGoalStatus } from "@prisma/client";

const STATUS_LABELS: Record<EmploymentGoalStatus, string> = {
  active: "Active",
  achieved: "Achieved",
  paused: "Paused",
  archived: "Archived",
};

export function EmploymentGoalsPanel({
  goals,
}: {
  goals: Pick<EmploymentGoal, "id" | "title" | "description" | "status" | "category">[];
}) {
  if (goals.length === 0) {
    return (
      <section aria-labelledby="employment-goals-heading" className="rounded-xl border p-4">
        <h2 id="employment-goals-heading" className="font-heading text-lg font-semibold">
          Employment goals
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No goals recorded yet. Goals help you track what you want from work — they are not
          used to score or rank you.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="employment-goals-heading" className="rounded-xl border p-4">
      <h2 id="employment-goals-heading" className="font-heading text-lg font-semibold">
        Employment goals
      </h2>
      <ul className="mt-4 space-y-2">
        {goals.map((goal) => (
          <li
            key={goal.id}
            className="rounded-lg bg-muted/40 px-3 py-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{goal.title}</span>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {STATUS_LABELS[goal.status]}
              </span>
            </div>
            {goal.description ? (
              <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
