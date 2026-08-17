"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ParticipationGoalForm() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch("/api/participation/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "Could not save goal");
      return;
    }
    setTitle("");
    setMessage("Goal saved.");
    window.location.reload();
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border p-4">
      <label className="block text-sm font-medium" htmlFor="goal-title">
        New goal
      </label>
      <input
        id="goal-title"
        className="w-full rounded border px-3 py-2 text-sm"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <Button type="submit" variant="default" size="default">
        Add goal
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
