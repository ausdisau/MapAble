import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { listParticipationGoalsForParticipant } from "@/lib/participation/participation-planner-service";

import { ParticipationGoalForm } from "./ParticipationGoalForm";

export default async function ParticipationPlannerPage() {
  const user = await requireAuth();
  const goals = await listParticipationGoalsForParticipant(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Community participation goals</h1>
      <p className="text-sm text-muted-foreground">
        Log outcomes and community participation goals. This is not funding advice or
        plan management.
      </p>

      <ParticipationGoalForm />

      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No goals logged yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {goals.map((g) => (
            <li key={g.id} className="p-4">
              <p className="font-medium">{g.title}</p>
              <p className="text-sm text-muted-foreground">Status: {g.status}</p>
              {g.targetDate ? (
                <p className="text-xs text-muted-foreground">
                  Target: {g.targetDate.toLocaleDateString("en-AU")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Link href="/dashboard" className="text-sm text-primary underline">
        Back to dashboard
      </Link>
    </div>
  );
}
