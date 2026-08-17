"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ApiCertificationReviewForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    const action = String(form.get("action"));
    const applicationId = form.get("applicationId");
    const payload: Record<string, unknown> = {
      applicationId,
      reviewNotes: form.get("reviewNotes"),
      rejectionReason: form.get("rejectionReason"),
      certificationTier: form.get("certificationTier") || "standard",
    };
    if (action === "review") payload.action = "review";
    if (action === "reject") payload.action = "reject";
    try {
      const res = await fetch("/api/admin/api-certification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      setMessage(`Application ${action} completed`);
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border p-4">
      <h2 className="font-medium">Review application</h2>
      <input name="applicationId" required placeholder="Application ID" className="w-full rounded border px-3 py-2 text-sm" />
      <select name="action" className="w-full rounded border px-3 py-2 text-sm">
        <option value="review">Start review</option>
        <option value="certify">Certify (use applicationId field)</option>
        <option value="reject">Reject</option>
      </select>
      <input name="certificationTier" placeholder="Tier (standard)" className="w-full rounded border px-3 py-2 text-sm" />
      <textarea name="reviewNotes" placeholder="Review notes" className="w-full rounded border px-3 py-2 text-sm" rows={2} />
      <textarea name="rejectionReason" placeholder="Rejection reason" className="w-full rounded border px-3 py-2 text-sm" rows={2} />
      <Button type="submit" variant="default" size="default" disabled={loading}>{loading ? "Saving…" : "Submit"}</Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
