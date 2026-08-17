"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function ProviderWorkerDetailActions({
  workerId,
  organisationId,
  displayName,
  profileSummary,
  active,
}: {
  workerId: string;
  organisationId: string;
  displayName: string;
  profileSummary: string | null;
  active: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [summary, setSummary] = useState(profileSummary ?? "");
  const [saving, setSaving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6 rounded-xl border border-border/60 p-4">
      <h2 className="font-medium">Manage worker</h2>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          setError(null);
          const res = await fetch(`/api/workers/${workerId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayName: name,
              profileSummary: summary || null,
            }),
          });
          setSaving(false);
          if (!res.ok) {
            const data = await res.json();
            setError(data.error ?? "Update failed");
            return;
          }
          router.refresh();
        }}
      >
        <AccessibleFormField id="edit-name" label="Display name" required>
          <input
            id="edit-name"
            className={formInputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </AccessibleFormField>
        <AccessibleFormField id="edit-summary" label="Profile summary">
          <textarea
            id="edit-summary"
            className={formInputClass}
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </AccessibleFormField>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" variant="default" size="sm" loading={saving}>
          Save changes
        </Button>
      </form>

      <Button
        type="button"
        variant={active ? "outline" : "default"}
        size="sm"
        loading={statusLoading}
        onClick={async () => {
          setStatusLoading(true);
          const res = await fetch(
            `/api/organisations/${organisationId}/workers/${workerId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ active: !active }),
            }
          );
          setStatusLoading(false);
          if (res.ok) router.refresh();
        }}
      >
        {active ? "Deactivate worker" : "Reactivate worker"}
      </Button>
    </div>
  );
}
