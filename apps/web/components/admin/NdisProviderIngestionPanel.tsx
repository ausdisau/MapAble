"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  lastRun: {
    status: string;
    providerCount: number;
    startedAt: string;
    finishedAt: string | null;
    errorMessage: string | null;
  } | null;
};

export function NdisProviderIngestionPanel({ lastRun }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runIngestion() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/ingest/ndis-providers", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        providerCount?: number;
        runId?: string;
        durationMs?: number;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? "Ingestion failed");
        return;
      }
      setMessage(
        `Ingestion complete: ${data.providerCount ?? 0} providers (${data.durationMs ?? 0} ms).`,
      );
      window.location.reload();
    } catch {
      setMessage("Could not reach ingestion endpoint.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="rounded-lg border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900 dark:bg-amber-950/20"
      aria-labelledby="ndis-ingestion-heading"
    >
      <h2 id="ndis-ingestion-heading" className="text-lg font-semibold">
        NDIS Provider Ingestion
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Loads the NDIS provider finder static JSON export into MapAble for
        discovery and search. This is a directory input only — not a guarantee
        of current NDIS registration. Verify against official NDIA sources
        before operational reliance.
      </p>

      {lastRun ? (
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium">Last run status</dt>
            <dd>{lastRun.status}</dd>
          </div>
          <div>
            <dt className="font-medium">Provider count</dt>
            <dd>{lastRun.providerCount}</dd>
          </div>
          <div>
            <dt className="font-medium">Started</dt>
            <dd>{new Date(lastRun.startedAt).toLocaleString("en-AU")}</dd>
          </div>
          <div>
            <dt className="font-medium">Finished</dt>
            <dd>
              {lastRun.finishedAt
                ? new Date(lastRun.finishedAt).toLocaleString("en-AU")
                : "—"}
            </dd>
          </div>
          {lastRun.errorMessage ? (
            <div className="sm:col-span-2">
              <dt className="font-medium">Error</dt>
              <dd className="text-destructive">{lastRun.errorMessage}</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No ingestion runs yet.</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="default"
          size="default"
          disabled={loading}
          onClick={() => void runIngestion()}
        >
          {loading ? "Running ingestion…" : "Run ingestion now"}
        </Button>
        {message ? (
          <p className="text-sm" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
