"use client";

import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";

 type Mission = {
  id: string;
  requestId: string;
  goal: string;
  status: string;
  modules: string[];
  createdAt: string;
};

type Receipt = {
  id: string;
  actionType: string;
  status: string;
  resultEntityType: string | null;
  resultEntityId: string | null;
  claimedAt: string;
  completedAt: string | null;
};

export function CareOSActivityPanel() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [missionResponse, receiptResponse] = await Promise.all([
          fetch("/api/intelligence/careos-missions"),
          fetch("/api/intelligence/careos-actions/receipts"),
        ]);
        const missionData = await missionResponse.json();
        const receiptData = await receiptResponse.json();
        if (cancelled) return;
        if (!missionResponse.ok) {
          throw new Error(missionData.error ?? "Mission history could not be loaded.");
        }
        if (!receiptResponse.ok && missionData.persistenceEnabled) {
          throw new Error(receiptData.error ?? "Action receipts could not be loaded.");
        }
        setEnabled(Boolean(missionData.persistenceEnabled));
        setMissions(Array.isArray(missionData.missions) ? missionData.missions : []);
        setReceipts(Array.isArray(receiptData.receipts) ? receiptData.receipts : []);
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "CareOS activity could not be loaded.");
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-labelledby="careos-activity-heading" className="space-y-4">
      <div>
        <h2 id="careos-activity-heading" className="text-2xl font-bold">
          My CareOS activity
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Inspect saved missions and receipts for actions that were actually executed.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          {error}
        </p>
      ) : null}

      {enabled === false ? (
        <Card variant="outlined">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Mission history is disabled in this environment. CareOS can still prepare a read-only mission for the current session.
          </CardContent>
        </Card>
      ) : null}

      {enabled ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card variant="outlined">
            <CardContent className="pt-6">
              <h3 className="font-semibold">Saved missions</h3>
              {missions.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No saved missions yet.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {missions.slice(0, 10).map((mission) => (
                    <li key={mission.id} className="rounded-lg border p-3">
                      <p className="font-medium">{mission.goal}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {mission.status.replaceAll("_", " ")} · {new Date(mission.createdAt).toLocaleString("en-AU")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent className="pt-6">
              <h3 className="font-semibold">Action receipts</h3>
              {receipts.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No confirmed CareOS actions have been executed.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {receipts.slice(0, 10).map((receipt) => (
                    <li key={receipt.id} className="rounded-lg border p-3">
                      <p className="font-medium">{receipt.actionType.replaceAll("_", " ")}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {receipt.status} · {new Date(receipt.claimedAt).toLocaleString("en-AU")}
                      </p>
                      {receipt.resultEntityType ? (
                        <p className="mt-2 text-xs">Created: {receipt.resultEntityType}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </section>
  );
}
