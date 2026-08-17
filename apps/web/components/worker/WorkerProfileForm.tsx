"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function WorkerProfileForm({
  workerId,
  displayName,
  profileSummary,
  languages,
}: {
  workerId: string;
  displayName: string;
  profileSummary: string | null;
  languages: string[];
}) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [summary, setSummary] = useState(profileSummary ?? "");
  const [langs, setLangs] = useState(languages.join(", "));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSaved(false);
        const res = await fetch(`/api/workers/${workerId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: name,
            profileSummary: summary || null,
            languages: langs
              .split(",")
              .map((l) => l.trim())
              .filter(Boolean),
          }),
        });
        setLoading(false);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Save failed");
          return;
        }
        setSaved(true);
        router.refresh();
      }}
    >
      <AccessibleFormField id="profile-name" label="Display name" required>
        <input
          id="profile-name"
          className={formInputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </AccessibleFormField>
      <AccessibleFormField id="profile-summary" label="Profile summary">
        <textarea
          id="profile-summary"
          className={formInputClass}
          rows={4}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </AccessibleFormField>
      <AccessibleFormField
        id="profile-languages"
        label="Languages"
        hint="Comma-separated, e.g. English, Auslan"
      >
        <input
          id="profile-languages"
          className={formInputClass}
          value={langs}
          onChange={(e) => setLangs(e.target.value)}
        />
      </AccessibleFormField>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {saved ? <p className="text-sm text-green-700">Profile saved.</p> : null}
      <Button type="submit" variant="default" size="default" loading={loading}>
        Save profile
      </Button>
    </form>
  );
}
