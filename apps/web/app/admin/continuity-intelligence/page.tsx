import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import {
  computeContinuityAdjustedWeeks,
  isContinuityIntelligenceEnabled,
  listAtRiskRelationships,
} from "@/lib/continuity/continuity-intelligence-service";

export default async function ContinuityIntelligenceAdminPage() {
  await requireAdmin();

  if (!isContinuityIntelligenceEnabled()) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Continuity intelligence</h1>
        <p className="text-sm text-muted-foreground">
          Enable CONTINUITY_INTELLIGENCE_ENABLED to view metrics.
        </p>
      </div>
    );
  }

  const [adjusted, atRisk] = await Promise.all([
    computeContinuityAdjustedWeeks(),
    listAtRiskRelationships({ limit: 20 }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Continuity intelligence</h1>
      <p className="text-sm text-muted-foreground">
        Suggest-only prioritisation — no automated escalation.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Continuity-adjusted weeks</p>
          <p className="text-2xl font-bold">{adjusted.weeks}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">At-risk relationships</p>
          <p className="text-2xl font-bold">{atRisk.length}</p>
        </div>
      </div>

      <Link href="/admin/backup-recovery" className="text-sm text-primary underline">
        Open backup recovery queue
      </Link>

      <section>
        <h2 className="font-medium">At-risk participants (sample)</h2>
        <ul className="mt-2 space-y-2">
          {atRisk.map((r) => (
            <li key={r.participantId} className="rounded border p-2 text-sm">
              Participant {r.participantId.slice(0, 8)} — {r.band} (score {r.score})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
