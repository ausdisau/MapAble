"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { OnboardingChecklistItem } from "@/lib/onboarding/onboarding-evaluator";

type Profile = {
  profileCompletenessScore: number;
  readyToMatch: boolean;
  checklistJson: OnboardingChecklistItem[] | unknown;
  role: string;
};

export function OnboardingChecklist() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/onboarding/me");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to load onboarding");
      setLoading(false);
      return;
    }
    setProfile(data.profile);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const checklist = Array.isArray(profile?.checklistJson)
    ? (profile.checklistJson as OnboardingChecklistItem[])
    : [];

  if (loading) {
    return <p className="text-muted-foreground">Loading checklist…</p>;
  }

  if (error) {
    return (
      <p role="alert" className="text-destructive">
        {error}
      </p>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/60 p-4">
        <p className="text-sm text-muted-foreground">Profile completeness</p>
        <p className="text-2xl font-bold">{profile.profileCompletenessScore}%</p>
        <p className="mt-2 text-sm">
          Ready to match:{" "}
          <span className="font-medium">
            {profile.readyToMatch ? "Yes" : "Not yet"}
          </span>
        </p>
      </div>

      <ul className="space-y-2">
        {checklist.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 rounded-lg border border-border/60 p-3 text-sm"
          >
            <span
              aria-hidden
              className={
                item.complete
                  ? "text-green-600"
                  : item.blocker
                    ? "text-destructive"
                    : "text-muted-foreground"
              }
            >
              {item.complete ? "✓" : "○"}
            </span>
            <div>
              <p className="font-medium">{item.label}</p>
              {item.detail ? (
                <p className="text-muted-foreground">{item.detail}</p>
              ) : null}
              {item.href && !item.complete ? (
                <Link
                  href={item.href}
                  className="mt-1 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Continue
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <Button type="button" variant="secondary" size="default" onClick={() => void load()}>
        Refresh checklist
      </Button>
    </div>
  );
}
