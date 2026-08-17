"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function NotificationSettingsForm({
  initial,
}: {
  initial: { category: string; channel: string; enabled: boolean }[];
}) {
  const [prefs, setPrefs] = useState(initial);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="max-w-xl space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const res = await fetch("/api/notification-preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: prefs }),
        });
        setLoading(false);
        setStatus(res.ok ? "Preferences saved." : "Could not save.");
      }}
    >
      <ul className="space-y-2">
        {prefs.map((p, i) => (
          <li
            key={`${p.category}-${p.channel}`}
            className="flex min-h-11 items-center justify-between rounded-lg border border-border px-4"
          >
            <span className="text-sm">
              {p.category} · {p.channel}
            </span>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={p.enabled}
                onChange={(e) => {
                  const next = [...prefs];
                  next[i] = { ...p, enabled: e.target.checked };
                  setPrefs(next);
                }}
              />
              Enabled
            </label>
          </li>
        ))}
      </ul>
      {status ? <p role="status">{status}</p> : null}
      <Button type="submit" variant="default" size="default" loading={loading}>
        Save preferences
      </Button>
    </form>
  );
}
