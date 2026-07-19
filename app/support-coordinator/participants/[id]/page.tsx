import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import {
  computeParticipantContinuityScore,
  isContinuityIntelligenceEnabled,
} from "@/lib/continuity/continuity-intelligence-service";
import { listParticipationGoalsForCoordinator } from "@/lib/participation/participation-planner-service";
import {
  getCoordinatorParticipantTimeline,
  getCoordinatorParticipantSummary,
} from "@/lib/support-coordinator/relationship-service";

export default async function CoordinatorParticipantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("coordinator:portal");
  const { id: participantId } = await params;

  const [summary, timeline, continuity, participation] = await Promise.all([
    getCoordinatorParticipantSummary(user.id, participantId),
    getCoordinatorParticipantTimeline(user.id, participantId),
    isContinuityIntelligenceEnabled()
      ? computeParticipantContinuityScore(participantId)
      : Promise.resolve(null),
    listParticipationGoalsForCoordinator({
      coordinatorId: user.id,
      participantId,
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <Link className="text-primary underline text-sm" href="/support-coordinator/participants">
        Back
      </Link>
      <h1 className="font-heading text-2xl font-bold">Participant overview</h1>
      <p className="text-sm text-muted-foreground">{summary.note}</p>

      {continuity?.enabled ? (
        <section className="rounded-lg border p-4">
          <h2 className="font-medium">Continuity band</h2>
          <p className="mt-1 text-sm">
            {continuity.band} — score {continuity.score}
            {continuity.lastBackupOutcome
              ? ` · last backup: ${continuity.lastBackupOutcome}`
              : ""}
          </p>
        </section>
      ) : null}

      {participation.goals.length > 0 ? (
        <section className="rounded-lg border p-4">
          <h2 className="font-medium">Participation goals</h2>
          <p className="text-xs text-muted-foreground">{participation.note}</p>
          <ul className="mt-2 text-sm">
            {participation.goals.map((g) => (
              <li key={g.id}>{g.title} — {g.status}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-lg border p-4">
        <h2 className="font-medium">Unified timeline</h2>
        {timeline.linkedTransport && (
          <p className="mt-2 text-sm">
            Care+transport: {timeline.linkedTransport.careRequestStatus} /{" "}
            {timeline.linkedTransport.transportStatus ?? "no transport"}
          </p>
        )}
        <h3 className="mt-4 text-sm font-medium">Recent care shifts</h3>
        <ul className="mt-1 text-sm text-muted-foreground">
          {timeline.careShifts.map((s) => (
            <li key={s.id}>
              {s.startAt?.toLocaleDateString("en-AU")} — {s.status}
            </li>
          ))}
        </ul>
        <h3 className="mt-4 text-sm font-medium">Recent transport</h3>
        <ul className="mt-1 text-sm text-muted-foreground">
          {timeline.transportBookings.map((t) => (
            <li key={t.id}>
              {t.pickupWindowStart?.toLocaleDateString("en-AU")} — {t.status}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
