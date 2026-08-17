import { OversightBoardActions } from "@/app/admin/oversight-board/OversightBoardActions";
import { requireAdmin } from "@/lib/auth/guards";
import { getOversightPortalSummary } from "@/lib/governance/oversight-board/oversight-service";

export default async function OversightBoardAdminPage() {
  await requireAdmin();
  const data = await getOversightPortalSummary();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Oversight board</h1>
      <section>
        <h2 className="font-medium">Meetings</h2>
        <ul className="mt-2 space-y-2">
          {(data.meetings ?? []).map((m) => (
            <li key={m.id} className="rounded border p-3 text-sm">
              {m.title} — {m.status}
              {m.minutesSummary ? (
                <p className="text-muted-foreground">{m.minutesSummary}</p>
              ) : null}
              <OversightBoardActions meetingId={m.id} status={m.status} />
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-medium">Decisions</h2>
        <ul className="mt-2 space-y-2">
          {(data.decisions ?? []).map((d) => (
            <li key={d.id} className="rounded border p-3 text-sm">
              {d.title}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
