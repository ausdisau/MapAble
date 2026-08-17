"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function FederatedAccountabilityForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    const action = String(form.get("action"));
    try {
      const res = await fetch("/api/admin/federated-accountability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action === "link_partner" ? undefined : action,
          partnerName: form.get("partnerName"),
          jurisdiction: form.get("jurisdiction"),
          jurisdictionLabel: form.get("jurisdictionLabel"),
          scope: form.get("scope"),
          partnerId: form.get("partnerId"),
          publicationId: form.get("publicationId"),
          periodLabel: form.get("periodLabel"),
          title: form.get("title"),
          summary: form.get("summary"),
          category: form.get("category"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      setMessage("Updated");
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border p-4">
      <h2 className="font-medium">Federated accountability</h2>
      <select name="action" className="w-full rounded border px-3 py-2 text-sm">
        <option value="link_partner">Link partner</option>
        <option value="link">Link partner to publication</option>
        <option value="bundle">Publish coordinated bundle</option>
      </select>
      <input name="partnerName" placeholder="Partner name" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="jurisdiction" placeholder="Jurisdiction" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="jurisdictionLabel" placeholder="Jurisdiction label" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="scope" placeholder="Scope" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="partnerId" placeholder="Partner ID" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="publicationId" placeholder="Publication ID" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="periodLabel" placeholder="Period label (bundle)" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="title" placeholder="Title (bundle)" className="w-full rounded border px-3 py-2 text-sm" />
      <textarea name="summary" placeholder="Summary (bundle)" className="w-full rounded border px-3 py-2 text-sm" rows={2} />
      <input name="category" placeholder="Category (bundle)" className="w-full rounded border px-3 py-2 text-sm" />
      <Button type="submit" variant="default" size="default" disabled={loading}>{loading ? "Saving…" : "Submit"}</Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
