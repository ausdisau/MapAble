"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ReviewItem = {
  id: string;
  missionId: string;
  participantId: string;
  category: string;
  priority: "information" | "attention" | "urgent";
  title: string;
  summary: string;
  assignedRole: string;
  status: string;
  dueAt: string;
  participantContactRequired: boolean;
  evidenceJson: unknown;
};

function tone(priority: ReviewItem["priority"]) {
  if (priority === "urgent") return "border-destructive/50 bg-destructive/10";
  if (priority === "attention") return "border-amber-500/50 bg-amber-500/10";
  return "border-border bg-card";
}

export function CareOSCoordinatorConsole() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [status, setStatus] = useState("open");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch(`/api/intelligence/careos-reviews?status=${encodeURIComponent(status)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The review queue could not be loaded.");
      setItems(data.items ?? data.reviews ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The review queue could not be loaded.");
    } finally { setLoading(false); }
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  async function update(id: string, nextStatus: string) {
    setError(null);
    const response = await fetch("/api/intelligence/careos-reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: nextStatus }),
    });
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "The review item could not be updated."); return; }
    await load();
  }

  return (
    <section aria-labelledby="coordinator-careos-heading" className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">CareOS human coordination</p>
        <h1 id="coordinator-careos-heading" className="text-3xl font-bold">Continuity review queue</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">Review service-system gaps, contact participants where required, and record progress. This console does not assign providers, workers or transport automatically.</p>
      </div>
      <Card><CardContent className="flex flex-wrap items-end gap-4 pt-6">
        <label className="space-y-1"><span className="block text-sm font-medium">Queue status</span><select className="min-h-11 rounded-md border border-input bg-background px-3" value={status} onChange={(event) => setStatus(event.target.value)}><option value="open">Open</option><option value="assigned">Assigned</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="cancelled">Cancelled</option></select></label>
        <Button variant="outline" onClick={() => void load()} loading={loading}>Refresh</Button>
      </CardContent></Card>
      {error ? <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">{error}</p> : null}
      {!loading && items.length === 0 ? <p className="rounded-lg border bg-muted/30 p-5">No review items are currently in this queue.</p> : null}
      <div className="space-y-4">
        {items.map((item) => (
          <article key={item.id} className={`rounded-xl border p-5 ${tone(item.priority)}`}>
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{item.title}</h2><p className="mt-1 text-sm">{item.summary}</p></div><span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase">{item.priority}</span></div>
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3"><div><dt className="font-medium">Category</dt><dd>{item.category.replaceAll("_", " ")}</dd></div><div><dt className="font-medium">Due</dt><dd>{new Date(item.dueAt).toLocaleString("en-AU")}</dd></div><div><dt className="font-medium">Participant contact</dt><dd>{item.participantContactRequired ? "Required" : "Not required"}</dd></div></dl>
            <p className="mt-3 text-xs text-muted-foreground">Mission {item.missionId} · Participant {item.participantId}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.status === "open" ? <Button size="sm" onClick={() => void update(item.id, "assigned")}>Assign to me</Button> : null}
              {["open", "assigned"].includes(item.status) ? <Button size="sm" variant="outline" onClick={() => void update(item.id, "in_progress")}>Start review</Button> : null}
              {item.status !== "resolved" ? <Button size="sm" variant="outline" onClick={() => void update(item.id, "resolved")}>Mark resolved</Button> : null}
              {item.status !== "cancelled" ? <Button size="sm" variant="ghost" onClick={() => void update(item.id, "cancelled")}>Cancel item</Button> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
