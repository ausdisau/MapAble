import type { PlanReviewStatus, RehabilitationPlanStatus } from "@prisma/client";

type PlanQueueItem = {
  id: string;
  title: string;
  status: RehabilitationPlanStatus;
  participant: { id: string; name: string };
  versions?: { version: number; changeSummary: string }[];
  reviews?: { id: string; status: PlanReviewStatus; notes: string }[];
};

interface PlanEditorQueuePanelProps {
  plans: PlanQueueItem[];
}

export function PlanEditorQueuePanel({ plans }: PlanEditorQueuePanelProps) {
  const draftPlans = plans.filter((p) => p.status === "draft");

  return (
    <section
      aria-labelledby="moves-editor-queue-heading"
      className="rounded-xl border p-4"
    >
      <h2 id="moves-editor-queue-heading" className="font-heading text-lg font-semibold">
        Plan editor queue
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Only verified clinical authors may create or approve treatment instructions.
        CareOS does not diagnose, prescribe, or alter treatment autonomously.
      </p>

      {draftPlans.length === 0 ? (
        <p className="mt-4 text-sm" role="status">
          No draft plans awaiting approval.
        </p>
      ) : (
        <ul className="mt-4 space-y-3" aria-label="Draft rehabilitation plans">
          {draftPlans.map((plan) => (
            <li key={plan.id} className="rounded-lg border p-3">
              <p className="font-medium">{plan.title}</p>
              <p className="text-sm text-muted-foreground">
                Participant: {plan.participant.name}
              </p>
              {plan.versions?.[0] ? (
                <p className="mt-1 text-sm">
                  Version {plan.versions[0].version}: {plan.versions[0].changeSummary}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type ReviewQueueItem = {
  id: string;
  status: PlanReviewStatus;
  notes: string;
  createdAt: Date | string;
  plan: {
    id: string;
    title: string;
    participant: { id: string; name: string };
    versions?: { version: number }[];
  };
};

interface ReviewQueuePanelProps {
  reviews: ReviewQueueItem[];
}

export function ReviewQueuePanel({ reviews }: ReviewQueuePanelProps) {
  const pending = reviews.filter((r) => r.status === "pending");

  return (
    <section
      aria-labelledby="moves-review-queue-heading"
      className="rounded-xl border p-4"
    >
      <h2 id="moves-review-queue-heading" className="font-heading text-lg font-semibold">
        Review queue
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Peer review of plan versions. Approval remains a human clinical decision.
      </p>

      {pending.length === 0 ? (
        <p className="mt-4 text-sm" role="status">
          No pending reviews.
        </p>
      ) : (
        <ul className="mt-4 space-y-3" aria-label="Pending plan reviews">
          {pending.map((review) => (
            <li key={review.id} className="rounded-lg border p-3">
              <p className="font-medium">{review.plan.title}</p>
              <p className="text-sm text-muted-foreground">
                Participant: {review.plan.participant.name}
              </p>
              {review.notes ? (
                <p className="mt-1 text-sm">Notes: {review.notes}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
