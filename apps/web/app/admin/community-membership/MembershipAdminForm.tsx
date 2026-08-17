"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function MembershipAdminForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    const action = String(form.get("action"));
    try {
      const res = await fetch("/api/admin/community-membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action === "register" ? undefined : action,
          memberLabel: form.get("memberLabel"),
          membershipType: form.get("membershipType"),
          region: form.get("region"),
          membershipId: form.get("membershipId"),
          termMonths: Number(form.get("termMonths") || 12),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      setMessage("Membership updated");
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border p-4">
      <h2 className="font-medium">Membership workflow</h2>
      <select name="action" className="w-full rounded border px-3 py-2 text-sm">
        <option value="register">Register (pending)</option>
        <option value="approve">Approve</option>
        <option value="renew">Renew</option>
        <option value="revoke">Revoke</option>
      </select>
      <input name="memberLabel" placeholder="Member label" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="membershipType" placeholder="Type" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="region" placeholder="Region" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="membershipId" placeholder="Membership ID" className="w-full rounded border px-3 py-2 text-sm" />
      <input name="termMonths" type="number" defaultValue={12} placeholder="Term months" className="w-full rounded border px-3 py-2 text-sm" />
      <Button type="submit" variant="default" size="default" disabled={loading}>{loading ? "Saving…" : "Submit"}</Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
