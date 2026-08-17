"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function EcosystemAdminForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    const action = String(form.get("action"));
    try {
      const res = await fetch("/api/admin/certified-api-ecosystem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          applicationId: form.get("applicationId"),
          entryId: form.get("entryId"),
          revokedReason: form.get("revokedReason"),
          organisationId: form.get("organisationId"),
          appName: form.get("appName"),
          certificationTier: form.get("certificationTier"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      setMessage("Ecosystem updated");
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border p-4">
      <h2 className="font-medium">Manage ecosystem</h2>
      <select name="action" className="w-full rounded border px-3 py-2 text-sm">
        <option value="promote">Promote certified application</option>
        <option value="revoke">Revoke entry</option>
        <option value="renew">Renew entry</option>
        <option value="add">Add entry manually</option>
      </select>
      <input name="applicationId" placeholder="Application ID (promote)" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="entryId" placeholder="Entry ID (revoke/renew)" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="organisationId" placeholder="Organisation ID (add)" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="appName" placeholder="App name (add)" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="certificationTier" placeholder="Tier" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="revokedReason" placeholder="Revoke reason" className="w-full rounded border px-3 py-2 text-sm" />
      <Button type="submit" variant="default" size="default" disabled={loading}>{loading ? "Saving…" : "Submit"}</Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
