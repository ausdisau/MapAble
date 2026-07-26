import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { listCoordinatorParticipants } from "@/lib/support/coordinator/relationship-service";

export default async function CoordinatorParticipantsPage() {
  const user = await requirePermission("coordinator:portal");
  const participants = await listCoordinatorParticipants(user.id);

  return (
    <div className="space-y-6 p-4">
      <Link className="text-primary underline text-sm" href="/support-coordinator">
        Back
      </Link>
      <h1 className="font-heading text-2xl font-bold">Participants</h1>
      {participants.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No authorised participants. Request access from a participant first.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {participants.map((p) => (
            <li key={p.participantId} className="p-4">
              <Link
                className="font-medium text-primary underline"
                href={`/support-coordinator/participants/${p.participantId}`}
              >
                {p.displayName}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
