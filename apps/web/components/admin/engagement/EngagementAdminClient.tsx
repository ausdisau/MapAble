"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Submission = {
  id: string;
  type: string;
  status: string;
  title: string | null;
  body: string;
  complaintId: string | null;
  participant: { name: string };
  organisation: { name: string } | null;
  createdAt: string;
};

export function EngagementAdminClient() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ciTitle, setCiTitle] = useState("");
  const [ciSummary, setCiSummary] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/engagement/submissions");
    const data = await res.json();
    setSubmissions(data.submissions ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function acknowledge(id: string) {
    await fetch("/api/admin/engagement/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: id, action: "acknowledge" }),
    });
    void load();
  }

  async function createCi() {
    if (!selectedId || !ciTitle || !ciSummary) return;
    setError(null);
    const res = await fetch("/api/admin/engagement/improvements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId: selectedId,
        title: ciTitle,
        summary: ciSummary,
      }),
    });
    if (!res.ok) {
      setError("Could not create improvement action");
      return;
    }
    setCiTitle("");
    setCiSummary("");
    setSelectedId(null);
    void load();
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <p className="text-muted-foreground">Loading queue…</p>
      ) : submissions.length === 0 ? (
        <p className="text-muted-foreground">No submissions.</p>
      ) : (
        <ul className="space-y-3">
          {submissions.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-border bg-card p-4 text-sm"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-medium">
                  {s.title ?? s.type} — {s.participant.name}
                </span>
                <span className="text-xs uppercase text-muted-foreground">
                  {s.status}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-muted-foreground">{s.body}</p>
              {s.complaintId ? (
                <p className="mt-1 text-xs">Complaint ID: {s.complaintId}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {s.status === "received" ? (
                  <Button type="button" variant="default" size="sm" onClick={() => void acknowledge(s.id)}>
                    Acknowledge
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedId(s.id)}
                >
                  Add CI action
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {selectedId ? (
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
          <h3 className="font-semibold">New improvement action</h3>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Title"
            value={ciTitle}
            onChange={(e) => setCiTitle(e.target.value)}
          />
          <textarea
            className="w-full rounded-md border px-3 py-2 text-sm min-h-[5rem]"
            placeholder="Participant-visible summary"
            value={ciSummary}
            onChange={(e) => setCiSummary(e.target.value)}
          />
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="button" variant="default" size="sm" onClick={() => void createCi()}>
              Create
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setSelectedId(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
