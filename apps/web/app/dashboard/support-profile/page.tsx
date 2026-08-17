"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProfileResponse = {
  profile: {
    version: number;
    publishedAt: string | null;
    sections: {
      routinesJson: { label: string; detail: string }[];
      preferencesJson: { label: string; detail: string }[];
      boundariesJson: { label: string; detail: string }[];
      escalationJson: Record<string, string | undefined>;
    };
  };
};

export default function SupportProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse["profile"] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/support-profile")
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Could not load support profile");
        }
        return res.json() as Promise<ProfileResponse>;
      })
      .then((data) => setProfile(data.profile))
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Support profile</h1>
        <p className="mt-1 text-muted-foreground">
          Your routines, preferences, boundaries, and escalation instructions —
          shared only with people you consent to.
        </p>
        <Link
          href="/dashboard/support-profile/edit"
          className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
        >
          Edit support profile →
        </Link>
      </header>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {profile ? (
        <dl className="grid max-w-2xl gap-4 rounded-xl border border-border bg-card p-4 text-sm">
          <div>
            <dt className="font-medium">Status</dt>
            <dd>
              {profile.publishedAt
                ? `Published (version ${profile.version})`
                : "Draft — not yet shared with workers"}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Routines</dt>
            <dd>{profile.sections.routinesJson.length} item(s)</dd>
          </div>
          <div>
            <dt className="font-medium">Preferences</dt>
            <dd>{profile.sections.preferencesJson.length} item(s)</dd>
          </div>
          <div>
            <dt className="font-medium">Boundaries</dt>
            <dd>{profile.sections.boundariesJson.length} item(s)</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
