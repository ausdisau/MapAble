"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";

type Mission = {
  id: string;
  goal: string;
  status: string;
  modules: string[];
  createdAt: string;
  updatedAt: string;
};

export default function CareOSMissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/intelligence/careos-missions", {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Mission history could not be loaded.");
        if (active) {
          setMissions(data.missions ?? []);
          setMessage(data.message ?? null);
        }
      } catch (error) {
        if (active) {
          setMessage(error instanceof Error ? error.message : "Mission history could not be loaded.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">CareOS</p>
      <h1 className="text-3xl font-bold">Your missions</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        Inspect the authority, evidence, confirmations, human review and event history attached to each mission.
      </p>

      {loading ? <p className="mt-8" role="status">Loading CareOS missions…</p> : null}
      {message ? <p className="mt-8 rounded-lg border bg-muted/30 p-4">{message}</p> : null}
      {!loading && missions.length === 0 && !message ? (
        <p className="mt-8 rounded-lg border bg-muted/30 p-4">No CareOS missions have been recorded yet.</p>
      ) : null}

      <div className="mt-8 space-y-4">
        {missions.map((mission) => (
          <Card key={mission.id} variant="outlined">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{mission.goal}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Updated {new Date(mission.updatedAt).toLocaleString("en-AU")}
                  </p>
                </div>
                <span className="rounded-full border px-3 py-1 text-xs capitalize">
                  {mission.status.replaceAll("_", " ")}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {mission.modules.map((module) => (
                  <span key={module} className="rounded-full bg-muted px-2 py-1 text-xs">{module}</span>
                ))}
              </div>
              <Link className="mt-5 inline-block font-medium text-primary underline-offset-4 hover:underline" href={`/careos/missions/${mission.id}`}>
                Open mission record
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
