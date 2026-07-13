"use client";

import { useEffect, useState } from "react";

type ActivityResponse = {
  agentsEnabled: string[];
  modulesEnabled: string[];
  memory: Array<{ id: string; key: string }>;
  recentRecommendations: Array<{ id: string; title: string; createdAt: string }>;
};

export function CareOSActivity() {
  const [activity, setActivity] = useState<ActivityResponse>();

  useEffect(() => {
    void fetch("/api/intelligence/careos/activity")
      .then((response) => response.json())
      .then(setActivity)
      .catch(() => setActivity(undefined));
  }, []);

  return (
    <section aria-labelledby="careos-activity-heading" className="rounded-xl border bg-card p-5">
      <h2 id="careos-activity-heading" className="font-heading text-xl font-bold">My CareOS activity</h2>
      <p className="mt-1 text-sm text-muted-foreground">Understand what CareOS used without exposing prompts or hidden reasoning.</p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="font-bold">Agents enabled</dt><dd>{activity?.agentsEnabled.join(", ") || "None"}</dd></div>
        <div><dt className="font-bold">Modules enabled</dt><dd>{activity?.modulesEnabled.join(", ") || "None"}</dd></div>
        <div><dt className="font-bold">Saved preferences</dt><dd>{activity?.memory.length ?? 0}</dd></div>
        <div><dt className="font-bold">Recent recommendations</dt><dd>{activity?.recentRecommendations.length ?? 0}</dd></div>
      </dl>
    </section>
  );
}
