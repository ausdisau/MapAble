"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function FederationNodesAdminForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    const action = String(form.get("action"));
    try {
      const res = await fetch("/api/admin/research-federation-nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action === "register" ? undefined : action,
          nodeName: form.get("nodeName"),
          institution: form.get("institution"),
          scope: form.get("scope"),
          linkedAgreementId: form.get("linkedAgreementId"),
          nodeId: form.get("nodeId"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      setMessage("Node updated");
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border p-4">
      <h2 className="font-medium">Federation nodes</h2>
      <select name="action" className="w-full rounded border px-3 py-2 text-sm">
        <option value="register">Register node</option>
        <option value="approve">Approve</option>
        <option value="suspend">Suspend</option>
        <option value="revoke">Revoke</option>
      </select>
      <input name="nodeName" placeholder="Node name" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="institution" placeholder="Institution" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="scope" placeholder="Scope" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="linkedAgreementId" placeholder="Linked agreement ID" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="nodeId" placeholder="Node ID (approve/suspend/revoke)" className="w-full rounded border px-3 py-2 text-sm" />
      <Button type="submit" variant="default" size="default" disabled={loading}>{loading ? "Saving…" : "Submit"}</Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
