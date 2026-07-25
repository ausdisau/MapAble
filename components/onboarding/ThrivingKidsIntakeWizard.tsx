"use client";

import Link from "next/link";
import { Component, useState, type ErrorInfo, type ReactNode } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import {
  FUNCTIONAL_CAPACITY_SCORE_LABELS,
  PRIMARY_PRESENTING_CONCERN_LABELS,
  PRIMARY_PRESENTING_CONCERNS,
  TRIAGE_FUNCTIONAL_DOMAIN_LABELS,
  TRIAGE_FUNCTIONAL_DOMAINS,
  type PrimaryPresentingConcern,
  type TriageFunctionalDomain,
} from "@/lib/schemas/thriving-kids-triage";

const STEPS = ["Demographics", "Functional assessment", "Routing result"] as const;

type FunctionalScores = Record<TriageFunctionalDomain, number>;

type TriageApiResult = {
  pathway:
    | "STANDARD_NDIS_PATHWAY"
    | "NDIS_EARLY_CHILDHOOD_APPROACH"
    | "THRIVING_KIDS_STATE_SUPPORT";
  summary: string;
  nextSteps: string[];
  requiresNdisApplication: boolean;
  ageYears: number;
  maxDomainScore: number;
  notice: string;
  error?: string;
};

const DEFAULT_SCORES: FunctionalScores = {
  communication: 2,
  interpersonalInteractions: 2,
  learningAndApplyingKnowledge: 2,
  mobility: 1,
  selfCare: 2,
  behavioralSelfRegulation: 2,
};

const HONESTY =
  "Draft routing guidance only — not a diagnosis, not a government Thriving Kids determination, and not a claim that MapAble delivers state or NDIS programs.";

class WizardErrorBoundary extends Component<
  { children: ReactNode; onReset: () => void },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ThrivingKidsIntakeWizard error", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="space-y-3 rounded-lg border border-destructive/40 p-4" role="alert">
          <h2 className="font-heading text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            The intake wizard hit an unexpected error. You can reset and try again.
          </p>
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => {
              this.setState({ error: null });
              this.props.onReset();
            }}
          >
            Reset wizard
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

function scoreLabel(score: number): string {
  if (score >= 1 && score <= 5) {
    return FUNCTIONAL_CAPACITY_SCORE_LABELS[score as 1 | 2 | 3 | 4 | 5];
  }
  return String(score);
}

function WizardBody({ participantId: initialParticipantId }: { participantId: string }) {
  const [step, setStep] = useState(0);
  const [participantId, setParticipantId] = useState(initialParticipantId);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [hasFormalDiagnosis, setHasFormalDiagnosis] = useState<boolean | null>(
    null
  );
  const [concern, setConcern] = useState<PrimaryPresentingConcern | "">("");
  const [scores, setScores] = useState<FunctionalScores>(DEFAULT_SCORES);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TriageApiResult | null>(null);

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!participantId.trim()) errors.participantId = "Participant ID is required";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      errors.dateOfBirth = "Enter date of birth as YYYY-MM-DD";
    }
    if (hasFormalDiagnosis === null) {
      errors.hasFormalDiagnosis = "Select whether a formal diagnosis exists";
    }
    if (!concern) errors.concern = "Select a primary presenting concern";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goNext = () => {
    setSubmitError("");
    if (step === 0 && !validateStep1()) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const goBack = () => {
    setSubmitError("");
    setStep((s) => Math.max(0, s - 1));
  };

  const submit = async () => {
    setLoading(true);
    setSubmitError("");
    setResult(null);
    try {
      const res = await fetch("/api/intake/pediatric-triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: participantId.trim(),
          dateOfBirth,
          hasFormalDiagnosis: Boolean(hasFormalDiagnosis),
          primaryPresentingConcern: concern,
          functionalCapacity: scores,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as TriageApiResult & {
        error?: string;
        details?: unknown;
      };
      if (!res.ok) {
        setSubmitError(data.error ?? "Could not complete triage");
        return;
      }
      setResult(data);
      setStep(2);
    } catch {
      setSubmitError("Could not complete triage");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">
          Thriving Kids foundational triage
        </h1>
        <p className="text-sm text-muted-foreground">
          Parental intake to draft-route children to Thriving Kids state supports or
          NDIS pathways based on simplified I-CAN v6 functional scores.
        </p>
      </header>

      <div
        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
        role="note"
      >
        {HONESTY}
      </div>

      <nav aria-label="Thriving Kids intake steps">
        <ol className="flex flex-wrap gap-2">
          {STEPS.map((label, index) => (
            <li key={label}>
              <span
                className={`inline-flex min-h-11 items-center rounded-md border px-3 py-2 text-sm ${
                  index === step
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background"
                }`}
                aria-current={index === step ? "step" : undefined}
              >
                {index + 1}. {label}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      {submitError ? (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      ) : null}

      {step === 0 ? (
        <section className="space-y-4" aria-labelledby="step1-heading">
          <h2 id="step1-heading" className="font-heading text-lg font-semibold">
            Demographics and primary concern
          </h2>
          <AccessibleFormField
            id="participantId"
            label="Participant ID"
            required
            error={fieldErrors.participantId}
          >
            <input
              id="participantId"
              className={formInputClass}
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              autoComplete="off"
            />
          </AccessibleFormField>
          <AccessibleFormField
            id="dateOfBirth"
            label="Child date of birth"
            required
            hint="Format YYYY-MM-DD"
            error={fieldErrors.dateOfBirth}
          >
            <input
              id="dateOfBirth"
              type="date"
              className={formInputClass}
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </AccessibleFormField>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              Formal diagnosis <span className="text-destructive">*</span>
              <span className="sr-only"> (required)</span>
            </legend>
            <div className="flex flex-wrap gap-4">
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="hasFormalDiagnosis"
                  checked={hasFormalDiagnosis === true}
                  onChange={() => setHasFormalDiagnosis(true)}
                />
                Yes
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="hasFormalDiagnosis"
                  checked={hasFormalDiagnosis === false}
                  onChange={() => setHasFormalDiagnosis(false)}
                />
                No
              </label>
            </div>
            {fieldErrors.hasFormalDiagnosis ? (
              <p role="alert" className="text-sm text-destructive">
                {fieldErrors.hasFormalDiagnosis}
              </p>
            ) : null}
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              Primary presenting concern{" "}
              <span className="text-destructive">*</span>
              <span className="sr-only"> (required)</span>
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {PRIMARY_PRESENTING_CONCERNS.map((value) => (
                <label
                  key={value}
                  className="flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm"
                >
                  <input
                    type="radio"
                    name="primaryPresentingConcern"
                    checked={concern === value}
                    onChange={() => setConcern(value)}
                  />
                  {PRIMARY_PRESENTING_CONCERN_LABELS[value]}
                </label>
              ))}
            </div>
            {fieldErrors.concern ? (
              <p role="alert" className="text-sm text-destructive">
                {fieldErrors.concern}
              </p>
            ) : null}
          </fieldset>
          <Button type="button" variant="default" size="default" onClick={goNext}>
            Continue to functional assessment
          </Button>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="space-y-4" aria-labelledby="step2-heading">
          <h2 id="step2-heading" className="font-heading text-lg font-semibold">
            Functional assessment (I-CAN v6 simplified)
          </h2>
          <p className="text-sm text-muted-foreground">
            Score each domain from 1 (Independent) to 5 (Requires pervasive/total
            support).
          </p>
          {TRIAGE_FUNCTIONAL_DOMAINS.map((domain) => {
            const value = scores[domain];
            const label = scoreLabel(value);
            return (
              <AccessibleFormField
                key={domain}
                id={`score-${domain}`}
                label={TRIAGE_FUNCTIONAL_DOMAIN_LABELS[domain]}
                hint={`Current: ${value} — ${label}`}
              >
                <input
                  id={`score-${domain}`}
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={value}
                  aria-valuemin={1}
                  aria-valuemax={5}
                  aria-valuenow={value}
                  aria-valuetext={`${value}: ${label}`}
                  className="w-full accent-primary"
                  onChange={(e) =>
                    setScores((prev) => ({
                      ...prev,
                      [domain]: Number(e.target.value),
                    }))
                  }
                />
              </AccessibleFormField>
            );
          })}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="default" onClick={goBack}>
              Back
            </Button>
            <Button
              type="button"
              variant="default"
              size="default"
              loading={loading}
              disabled={loading}
              onClick={() => void submit()}
            >
              Submit triage
            </Button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4" aria-labelledby="step3-heading">
          <h2 id="step3-heading" className="font-heading text-lg font-semibold">
            Routing result
          </h2>
          {result ? (
            <>
              <p className="text-sm font-medium">{result.summary}</p>
              <p className="text-sm">
                Pathway:{" "}
                <span className="font-medium">{result.pathway}</span>
                {" · "}
                Age {result.ageYears} · Max domain score {result.maxDomainScore}
                {" · "}
                NDIS application suggested:{" "}
                {result.requiresNdisApplication ? "yes" : "no"}
              </p>
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                {result.nextSteps.map((stepText) => (
                  <li key={stepText}>{stepText}</li>
                ))}
              </ol>
              <p className="text-xs text-muted-foreground" role="note">
                {result.notice}
              </p>
              <div className="flex flex-wrap gap-2">
                {result.pathway === "THRIVING_KIDS_STATE_SUPPORT" ? (
                  <Button variant="default" size="default" asChild>
                    <Link href="/care/find">Connect to State Services</Link>
                  </Button>
                ) : (
                  <Button variant="default" size="default" asChild>
                    <Link href="/dashboard">Start NDIS Access Request</Link>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => {
                    setResult(null);
                    setStep(0);
                  }}
                >
                  Start over
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Links are scaffold destinations inside MapAble — they do not submit
                government applications.
              </p>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No result yet. Return to the assessment step to submit.
              </p>
              <Button type="button" variant="outline" size="default" onClick={goBack}>
                Back to assessment
              </Button>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

export function ThrivingKidsIntakeWizard({
  participantId = "",
}: {
  participantId?: string;
}) {
  const [resetKey, setResetKey] = useState(0);
  return (
    <WizardErrorBoundary
      onReset={() => setResetKey((k) => k + 1)}
      key={resetKey}
    >
      <WizardBody participantId={participantId} />
    </WizardErrorBoundary>
  );
}
