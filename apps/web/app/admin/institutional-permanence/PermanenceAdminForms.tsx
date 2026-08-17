"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function PermanenceAdminForms() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function post(url: string, body: Record<string, unknown>) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Action failed");
  }

  async function publishAudit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    try {
      await post("/api/admin/civic-audit-index", {
        auditYear: form.get("auditYear"),
        title: form.get("title"),
        overallScore: Number(form.get("overallScore")),
        findings: { summary: form.get("findingsSummary") },
      });
      setMessage("Audit published");
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function reviewCheckpoint(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    try {
      await post("/api/admin/institutional-continuity", {
        action: "review_checkpoint",
        checkpointId: form.get("checkpointId"),
        completed: form.get("completed") === "true",
        reviewNotes: form.get("reviewNotes"),
      });
      setMessage("Checkpoint reviewed");
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function publishReport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    try {
      await post("/api/admin/data-trust-reports", {
        yearLabel: form.get("yearLabel"),
        title: form.get("title"),
        summary: form.get("summary"),
        report: { body: form.get("reportBody") },
      });
      setMessage("Report published");
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function upsertSafeguard(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    try {
      await post("/api/admin/constitutional-safeguards", {
        articleKey: form.get("articleKey"),
        title: form.get("title"),
        body: form.get("body"),
        sortOrder: Number(form.get("sortOrder") || 0),
      });
      setMessage("Safeguard saved");
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={publishAudit} className="space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">Publish civic audit</h2>
        <input name="auditYear" required placeholder="Audit year" className="w-full rounded border px-3 py-2 text-sm" />
        <input name="title" required placeholder="Title" className="w-full rounded border px-3 py-2 text-sm" />
        <input name="overallScore" type="number" step="any" required placeholder="Score" className="w-full rounded border px-3 py-2 text-sm" />
        <textarea name="findingsSummary" placeholder="Findings summary" className="w-full rounded border px-3 py-2 text-sm" rows={2} />
        <Button type="submit" variant="default" size="default" disabled={loading}>Publish audit</Button>
      </form>

      <form onSubmit={reviewCheckpoint} className="space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">Review continuity checkpoint</h2>
        <input name="checkpointId" required placeholder="Checkpoint ID" className="w-full rounded border px-3 py-2 text-sm" />
        <select name="completed" className="w-full rounded border px-3 py-2 text-sm">
          <option value="true">Completed</option>
          <option value="false">Not completed</option>
        </select>
        <textarea name="reviewNotes" placeholder="Review notes" className="w-full rounded border px-3 py-2 text-sm" rows={2} />
        <Button type="submit" variant="default" size="default" disabled={loading}>Save review</Button>
      </form>

      <form onSubmit={publishReport} className="space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">Publish data trust report</h2>
        <input name="yearLabel" required placeholder="Year label" className="w-full rounded border px-3 py-2 text-sm" />
        <input name="title" required placeholder="Title" className="w-full rounded border px-3 py-2 text-sm" />
        <textarea name="summary" required placeholder="Summary" className="w-full rounded border px-3 py-2 text-sm" rows={2} />
        <textarea name="reportBody" placeholder="Report body" className="w-full rounded border px-3 py-2 text-sm" rows={3} />
        <Button type="submit" variant="default" size="default" disabled={loading}>Publish report</Button>
      </form>

      <form onSubmit={upsertSafeguard} className="space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">Upsert safeguard article</h2>
        <p className="text-xs text-muted-foreground">Operational principles only — not legal constitutional documents.</p>
        <input name="articleKey" required placeholder="Article key" className="w-full rounded border px-3 py-2 text-sm" />
        <input name="title" required placeholder="Title" className="w-full rounded border px-3 py-2 text-sm" />
        <textarea name="body" required placeholder="Body" className="w-full rounded border px-3 py-2 text-sm" rows={3} />
        <input name="sortOrder" type="number" placeholder="Sort order" className="w-full rounded border px-3 py-2 text-sm" />
        <Button type="submit" variant="default" size="default" disabled={loading}>Save article</Button>
      </form>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
