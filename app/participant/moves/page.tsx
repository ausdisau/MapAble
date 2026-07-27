import { GoalsPanel, PlanStatusBadge } from "@/components/moves/GoalsPanel";
import { PlanPausePanel } from "@/components/moves/PlanPausePanel";
import { TodayActivitiesPanel } from "@/components/moves/TodayActivitiesPanel";
import { requireAuth } from "@/lib/auth/guards";
import { movesRehabilitationConfig } from "@/lib/config/moves-rehabilitation";
import { listTodayActivities } from "@/lib/moves/activities-service";
import { listPlansForParticipant } from "@/lib/moves/plans-service";

export const metadata = { title: "My rehabilitation | MapAble Moves" };

export default async function ParticipantMovesPage() {
  const user = await requireAuth();

  const plans = movesRehabilitationConfig.enabled
    ? await listPlansForParticipant(user.id)
    : [];
  const todayActivities = movesRehabilitationConfig.enabled
    ? await listTodayActivities(user.id)
    : [];

  const allGoals = plans.flatMap((p) => p.goals);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">My rehabilitation</h1>
        <p className="text-muted-foreground">
          View your goals, today&apos;s activities, and provide feedback. MapAble Moves
          coordinates rehabilitation — it does not diagnose, prescribe, or change your
          treatment without your clinician. Activity completion is not proof of clinical
          improvement.
        </p>
      </header>

      {!movesRehabilitationConfig.enabled ? (
        <p className="rounded-lg border border-dashed p-4 text-sm" role="status">
          MapAble Moves rehabilitation is not enabled in this environment.
        </p>
      ) : (
        <>
          <GoalsPanel goals={allGoals} />
          <TodayActivitiesPanel activities={todayActivities} />
          <PlanPausePanel plans={plans} />

          {plans.length > 0 ? (
            <section aria-labelledby="moves-plans-heading" className="rounded-xl border p-4">
              <h2 id="moves-plans-heading" className="font-heading text-lg font-semibold">
                Your plans
              </h2>
              <ul className="mt-4 space-y-2">
                {plans.map((plan) => (
                  <li
                    key={plan.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2"
                  >
                    <span>{plan.title}</span>
                    <PlanStatusBadge status={plan.status} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
