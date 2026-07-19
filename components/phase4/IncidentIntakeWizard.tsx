"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { IncidentSeverityExplainer } from "@/components/phase4/IncidentSeverityExplainer";
import { Button } from "@/components/ui/button";

type IntakePath = "concern" | "incident" | "safeguarding";

const STEPS = ["path", "context", "details", "review"] as const;

export function IncidentIntakeWizard({
  careShiftId,
  redirectTo,
}: {
  careShiftId?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intakePath, setIntakePath] = useState<IntakePath>("concern");
  const [participantIntent, setParticipantIntent] = useState<
    "report_only" | "want_help_resolving"
  >("report_only");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "complaint",
    severity: "medium",
    immediateRiskPresent: false,
    possibleReportableIncident: false,
    safeguardingConcern: false,
  });

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/incidents/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        intakePath,
        participantIntent,
        careShiftId,
        stepAnswers: { completedSteps: STEPS.length },
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not submit");
      setLoading(false);
      return;
    }
    const { incident } = await res.json();
    await fetch(`/api/incidents/${incident.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit" }),
    });
    router.push(redirectTo ?? `/dashboard/safety/incidents/${incident.id}`);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-bold">Report a concern or incident</h1>
      <p className="text-sm text-muted-foreground">
        Step {step + 1} of {STEPS.length}. This does not automatically report to the NDIS
        Commission. If you are in immediate danger, call 000.
      </p>

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {step === 0 ? (
        <fieldset className="space-y-3">
          <legend className="font-medium">What kind of report is this?</legend>
          {(
            [
              ["concern", "A concern — something felt wrong but may not be an incident"],
              ["incident", "An incident — something happened that should be recorded"],
              ["safeguarding", "Safeguarding — serious harm or abuse may be involved"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              htmlFor={`intake-path-${value}`}
              className="flex min-h-11 items-start gap-2 text-sm"
            >
              <input
                id={`intake-path-${value}`}
                type="radio"
                name="intakePath"
                checked={intakePath === value}
                onChange={() => {
                  setIntakePath(value);
                  if (value === "safeguarding") {
                    setForm((f) => ({ ...f, safeguardingConcern: true }));
                  }
                }}
              />
              {label}
            </label>
          ))}
        </fieldset>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <label htmlFor="participant-intent" className="block text-sm font-medium">
            What would you like us to do?
          </label>
          <select
            id="participant-intent"
            className={formInputClass}
            value={participantIntent}
            onChange={(e) =>
              setParticipantIntent(
                e.target.value as "report_only" | "want_help_resolving"
              )
            }
          >
            <option value="report_only">Record this only</option>
            <option value="want_help_resolving">I want help resolving this</option>
          </select>
          {careShiftId ? (
            <p className="text-sm text-muted-foreground">
              Linked to your current shift.
            </p>
          ) : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <IncidentSeverityExplainer />
          <label htmlFor="title" className="text-sm font-medium">
            Short title
          </label>
          <input
            id="title"
            className={formInputClass}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <label htmlFor="description" className="text-sm font-medium">
            What happened?
          </label>
          <textarea
            id="description"
            className={formInputClass}
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <label htmlFor="category" className="text-sm font-medium">
            Category
          </label>
          <select
            id="category"
            className={formInputClass}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="complaint">Complaint</option>
            <option value="access_need_not_met">Access need not met</option>
            <option value="safeguarding_concern">Safeguarding concern</option>
            <option value="possible_reportable_incident">Possible reportable incident</option>
            <option value="other">Other</option>
          </select>
          <label htmlFor="severity" className="text-sm font-medium">
            Severity
          </label>
          <select
            id="severity"
            className={formInputClass}
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <label
            htmlFor="immediate-risk"
            className="flex min-h-11 items-center gap-2 text-sm"
          >
            <input
              id="immediate-risk"
              type="checkbox"
              checked={form.immediateRiskPresent}
              onChange={(e) =>
                setForm({ ...form, immediateRiskPresent: e.target.checked })
              }
            />
            Immediate risk to safety
          </label>
        </div>
      ) : null}

      {step === 3 ? (
        <dl className="space-y-2 rounded-xl border p-4 text-sm">
          <div>
            <dt className="font-medium">Path</dt>
            <dd>{intakePath}</dd>
          </div>
          <div>
            <dt className="font-medium">Intent</dt>
            <dd>{participantIntent.replace(/_/g, " ")}</dd>
          </div>
          <div>
            <dt className="font-medium">Title</dt>
            <dd>{form.title}</dd>
          </div>
          <div>
            <dt className="font-medium">Severity</dt>
            <dd>{form.severity}</dd>
          </div>
        </dl>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {step > 0 ? (
          <Button type="button" variant="outline" size="default" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={() => setStep(step + 1)}
            disabled={step === 2 && (!form.title || !form.description)}
          >
            Continue
          </Button>
        ) : (
          <Button
            type="button"
            variant="default"
            size="default"
            loading={loading}
            onClick={() => void submit()}
          >
            Submit report
          </Button>
        )}
      </div>
    </div>
  );
}
