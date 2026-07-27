import {
  PlanEditorQueuePanel,
  ReviewQueuePanel,
} from "@/components/moves/ClinicianQueuePanels";
import { requireAuth } from "@/lib/auth/guards";
import { movesRehabilitationConfig } from "@/lib/config/moves-rehabilitation";
import {
  listPendingReviews,
  listPlansForClinician,
} from "@/lib/moves/plans-service";

export const metadata = { title: "Rehabilitation plans | MapAble Moves" };

export default async function ClinicianMovesPage() {
  const user = await requireAuth();

  let plans: Awaited<ReturnType<typeof listPlansForClinician>> = [];
  let pendingReviews: Awaited<ReturnType<typeof listPendingReviews>> = [];

  if (movesRehabilitationConfig.enabled) {
    try {
      [plans, pendingReviews] = await Promise.all([
        listPlansForClinician(user.id),
        listPendingReviews(user.id),
      ]);
    } catch {
      // Clinical author not registered — show empty queues with guidance
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Rehabilitation plans</h1>
        <p className="text-muted-foreground">
          Author and review participant rehabilitation plans. Only authorised clinical
          authors may approve treatment instructions. Activity completion is not proof of
          clinical improvement.
        </p>
      </header>

      {!movesRehabilitationConfig.enabled ? (
        <p className="rounded-lg border border-dashed p-4 text-sm" role="status">
          MapAble Moves rehabilitation is not enabled in this environment.
        </p>
      ) : (
        <>
          <PlanEditorQueuePanel plans={plans} />
          <ReviewQueuePanel reviews={pendingReviews} />
        </>
      )}
    </div>
  );
}
