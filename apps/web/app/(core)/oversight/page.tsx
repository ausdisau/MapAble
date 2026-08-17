import { getOversightPortalSummary } from "@/lib/governance/oversight-board/oversight-service";

export default async function OversightPage() {
  const data = await getOversightPortalSummary();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Oversight board</h1>
      {data.disabled ? (
        <p>Oversight board portal is not enabled in this environment.</p>
      ) : (
        <>
          <section>
            <h2 className="font-medium">Meetings</h2>
            <ul className="mt-2 space-y-2">
              {data.meetings.map((m) => (
                <li key={m.id} className="rounded border p-3 text-sm">
                  <p className="font-medium">{m.title}</p>
                  <p className="text-muted-foreground">{m.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.status}
                    {m.meetingAt
                      ? ` — ${m.meetingAt.toLocaleDateString("en-AU")}`
                      : ""}
                  </p>
                  {m.minutesSummary ? (
                    <p className="mt-2 text-sm">{m.minutesSummary}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="font-medium">Published decisions</h2>
            <ul className="mt-2 space-y-2">
              {data.decisions.map((d) => (
                <li key={d.id} className="rounded border p-3 text-sm">
                  {d.title}
                  <p className="text-muted-foreground">{d.summary}</p>
                  {d.disputeContact ? (
                    <p className="text-xs text-muted-foreground">
                      Disputes: {d.disputeContact}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
