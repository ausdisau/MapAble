"use client";

import { useState } from "react";

import { COMPLETION_NOT_IMPROVEMENT_DISCLAIMER } from "@/lib/moves/clinical-boundaries";

type ActivityItem = {
  id: string;
  title: string;
  scheduledAt: Date | string | null;
  status: string;
  instructionsAccessible: string;
};

interface TodayActivitiesPanelProps {
  activities: ActivityItem[];
}

export function TodayActivitiesPanel({ activities }: TodayActivitiesPanelProps) {
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleComplete(activityId: string) {
    setSubmitting(activityId);
    setMessage(null);
    try {
      const res = await fetch("/api/participant/moves/activities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId,
          participantFeedback: feedback[activityId] ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Could not record completion");
        return;
      }
      setMessage(data.disclaimer ?? COMPLETION_NOT_IMPROVEMENT_DISCLAIMER);
      window.location.reload();
    } catch {
      setMessage("Network error — please try again");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <section
      aria-labelledby="moves-today-heading"
      className="rounded-xl border p-4"
    >
      <h2 id="moves-today-heading" className="font-heading text-lg font-semibold">
        Today&apos;s activities
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {COMPLETION_NOT_IMPROVEMENT_DISCLAIMER}
      </p>

      {message ? (
        <p className="mt-3 rounded-lg border border-dashed p-3 text-sm" role="status">
          {message}
        </p>
      ) : null}

      {activities.length === 0 ? (
        <p className="mt-4 text-sm" role="status">
          No activities scheduled for today.
        </p>
      ) : (
        <ul className="mt-4 space-y-4" aria-label="Today's rehabilitation activities">
          {activities.map((activity) => (
            <li key={activity.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{activity.title}</p>
                  {activity.scheduledAt ? (
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.scheduledAt).toLocaleString("en-AU")}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm">{activity.instructionsAccessible}</p>
                </div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {activity.status}
                </span>
              </div>

              {activity.status === "scheduled" ? (
                <div className="mt-3 space-y-2">
                  <label htmlFor={`feedback-${activity.id}`} className="block text-sm">
                    Optional feedback (not a symptom assessment)
                  </label>
                  <textarea
                    id={`feedback-${activity.id}`}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={2}
                    value={feedback[activity.id] ?? ""}
                    onChange={(e) =>
                      setFeedback((prev) => ({
                        ...prev,
                        [activity.id]: e.target.value,
                      }))
                    }
                    placeholder="How did this feel? Your clinician will review."
                  />
                  <button
                    type="button"
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                    disabled={submitting === activity.id}
                    onClick={() => handleComplete(activity.id)}
                  >
                    {submitting === activity.id ? "Recording…" : "Mark complete"}
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
