"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function FederatedResearchAdminForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    const action = String(form.get("action"));
    try {
      const res = await fetch("/api/admin/federated-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action === "create" ? undefined : action,
          partnerName: form.get("partnerName"),
          scope: form.get("scope"),
          agreementId: form.get("agreementId"),
          linkedSafeRoomProjectId: form.get("linkedSafeRoomProjectId"),
          ethicsReviewNotes: form.get("ethicsReviewNotes"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      setMessage("Agreement updated");
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border p-4">
      <h2 className="font-medium">Federated research</h2>
      <select name="action" className="w-full rounded border px-3 py-2 text-sm">
        <option value="create">Create agreement</option>
        <option value="ethics_review">Submit ethics review</option>
        <option value="approve">Approve</option>
        <option value="activate">Activate</option>
        <option value="archive">Archive</option>
      </select>
      <input name="partnerName" placeholder="Partner name" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="scope" placeholder="Scope" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="agreementId" placeholder="Agreement ID" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="linkedSafeRoomProjectId" placeholder="Safe room project ID" className="w-full rounded border px-3 py-2 text-sm" />
      <textarea name="ethicsReviewNotes" placeholder="Ethics notes" className="w-full rounded border px-3 py-2 text-sm" rows={2} />
      <Button type="submit" variant="default" size="default" disabled={loading}>{loading ? "Saving…" : "Submit"}</Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
