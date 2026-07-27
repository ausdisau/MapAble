"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";

type Mission = {
  id: string;
  goal: string;
  status: string;
  modules: string[];
  graphJson: { nodes?: Array<{ id: string; label: string; status: string; details: string }> };
  alertsJson: Array<{ id: string; severity: string; title: string; explanation: string }>;
  createdAt: string;
  updatedAt: string;
  events: Array<{
    id: string;
    eventType: string;
    sourceModule: string;
    severity: string;
    summary: string;
    createdAt: string;
  }>;
  reviews: Array<{
    id: string;
    title: string;
    summary: string;
    priority: string;
    status: string;
    assignedRole: string;
    dueAt: string;
  }>;
};

export function CareOSMissionDetail({ missionId }: { missionId: string }) {
  const [mission, setMission] = useState<Mission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch(`/api/intelligence/careos-missions/${missionId}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "The mission could not be loaded.");
        if (active) setMission(data.mission);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "The mission could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [missionId]);

  if (loading) return <p role="status">Loading CareOS mission…</p>;
  if (error) return <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">{error}</p>;
  if (!mission) return null;

  return (
    <section aria-labelledby="careos-mission-detail-heading" className="space-y-8">
      <div>
        <Link href="/ask" className="text-sm font-medium text-primary underline-offset-4 hover:underline">← Back to CareOS</Link>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-primary">CareOS mission record</p>
        <h1 id="careos-mission-detail-heading" className="text-3xl font-bold">{mission.goal}</h1>
        <p className="mt-2 text-muted-foreground">Status: {mission.status.replaceAll("_", " ")} · Created {new Date(mission.createdAt).toLocaleString("en-AU")}</p>
        <div className="mt-3 flex flex-wrap gap-2">{mission.modules.map((module) => <span key={module} className="rounded-full border px-3 py-1 text-xs font-medium">{module}</span>)}</div>
      </div>

      <section aria-labelledby="mission-dependencies-heading">
        <h2 id="mission-dependencies-heading" className="text-xl font-semibold">Mission dependencies</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(mission.graphJson?.nodes ?? []).map((node) => <Card key={node.id}><CardContent className="pt-6"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{node.label}</h3><span className="rounded-full border px-2 py-1 text-xs">{node.status.replaceAll("_", " ")}</span></div><p className="mt-2 text-sm">{node.details}</p></CardContent></Card>)}
        </div>
      </section>

      <section aria-labelledby="mission-timeline-heading">
        <h2 id="mission-timeline-heading" className="text-xl font-semibold">Event timeline</h2>
        {mission.events.length === 0 ? <p className="mt-3 rounded-lg border bg-muted/30 p-4">No operational events have been recorded yet.</p> : <ol className="mt-4 border-l-2 border-border pl-6">{mission.events.map((event) => <li key={event.id} className="relative pb-6"><span className="absolute -left-[31px] top-1 size-3 rounded-full border-2 border-background bg-primary" aria-hidden="true" /><p className="font-semibold">{event.summary}</p><p className="text-sm text-muted-foreground">{event.eventType.replaceAll("_", " ")} · {event.sourceModule} · {new Date(event.createdAt).toLocaleString("en-AU")}</p><span className="mt-1 inline-block rounded-full border px-2 py-0.5 text-xs">{event.severity}</span></li>)}</ol>}
      </section>

      <section aria-labelledby="mission-reviews-heading">
        <h2 id="mission-reviews-heading" className="text-xl font-semibold">Human review</h2>
        {mission.reviews.length === 0 ? <p className="mt-3 rounded-lg border bg-muted/30 p-4">No human review work is attached to this mission.</p> : <div className="mt-4 space-y-3">{mission.reviews.map((review) => <article key={review.id} className="rounded-xl border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold">{review.title}</h3><span className="rounded-full border px-2 py-1 text-xs">{review.priority}</span></div><p className="mt-2 text-sm">{review.summary}</p><p className="mt-3 text-xs text-muted-foreground">{review.assignedRole.replaceAll("_", " ")} · {review.status.replaceAll("_", " ")} · Due {new Date(review.dueAt).toLocaleString("en-AU")}</p></article>)}</div>}
      </section>

      <section aria-labelledby="mission-alerts-heading">
        <h2 id="mission-alerts-heading" className="text-xl font-semibold">Continuity alerts</h2>
        <div className="mt-4 space-y-3">{(mission.alertsJson ?? []).map((alert) => <article key={alert.id} className="rounded-xl border bg-card p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{alert.title}</h3><span className="rounded-full border px-2 py-1 text-xs">{alert.severity}</span></div><p className="mt-2 text-sm">{alert.explanation}</p></article>)}</div>
      </section>
    </section>
  );
}
