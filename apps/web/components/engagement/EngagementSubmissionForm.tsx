"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

type IntakeType = "general_feedback" | "complaint";

export function EngagementSubmissionForm({
  participantId,
  defaultType = "general_feedback",
}: {
  participantId?: string;
  defaultType?: IntakeType;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"safety" | "form">("safety");
  const [involvesSafety, setInvolvesSafety] = useState(false);
  const [type, setType] = useState<IntakeType>(defaultType);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [advocateInvolved, setAdvocateInvolved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!body.trim()) {
      setError("Please describe your feedback or complaint.");
      return;
    }
    setLoading(true);
    setError(null);

    const endpoint =
      type === "complaint" ? "/api/engagement/complaints" : "/api/engagement/submissions";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          type,
          title: title || undefined,
          body,
          involvesSafety,
          advocateInvolved,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not submit");
        return;
      }
      const id = data.submission?.id;
      router.push(id ? `/dashboard/engagement/${id}` : "/dashboard/engagement");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "safety") {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Before you start</h2>
        <p className="text-sm text-muted-foreground">
          Does this involve immediate safety risk or abuse?
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            size="default"
            variant={involvesSafety ? "default" : "secondary"}
            onClick={() => {
              setInvolvesSafety(true);
              window.location.href = "/dashboard/safety";
            }}
          >
            Yes — go to Safety centre
          </Button>
          <Button
            type="button"
            size="default"
            variant={!involvesSafety ? "default" : "secondary"}
            onClick={() => {
              setInvolvesSafety(false);
              setStep("form");
            }}
          >
            No — continue with feedback
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-4 rounded-xl border border-border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <fieldset className="space-y-2">
        <legend className="font-semibold">What would you like to do?</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="type"
            checked={type === "general_feedback"}
            onChange={() => setType("general_feedback")}
          />
          Share general feedback
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="type"
            checked={type === "complaint"}
            onChange={() => setType("complaint")}
          />
          Make a formal complaint
        </label>
      </fieldset>

      <label className="block text-sm">
        Title (optional)
        <input
          className={`${formInputClass} mt-1`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label className="block text-sm">
        {type === "complaint" ? "Describe your complaint" : "Your feedback"}
        <textarea
          required
          className={`${formInputClass} mt-1 min-h-[8rem]`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={advocateInvolved}
          onChange={(e) => setAdvocateInvolved(e.target.checked)}
        />
        An advocate or support person is helping me
      </label>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="default" size="default" disabled={loading}>
        {loading ? "Submitting…" : "Submit"}
      </Button>
    </form>
  );
}
