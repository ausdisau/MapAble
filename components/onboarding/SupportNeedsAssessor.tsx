"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/app/lib/utils";
import { AuthAlert } from "@/components/auth/AuthAlert";
import {
  ConsentScopeCheckbox,
  type ConsentScopeOption,
} from "@/components/consent/ConsentScopeCheckbox";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { SensitiveDataBanner } from "@/components/forms/SensitiveDataBanner";
import { Button } from "@/components/ui/button";
import {
  SUPPORT_NEEDS_INTENSITY_OPTIONS,
  SUPPORT_NEEDS_LIFE_AREAS,
  type SupportNeedsIntensity,
  type SupportNeedsLifeAreaId,
} from "@/lib/intake/support-needs-assessor";

const CONSENT_SCOPES: ConsentScopeOption[] = [
  {
    id: "draft_processing",
    label:
      "MapAble may process this support needs snapshot to prepare my planning draft",
    description:
      "Used only to store and show your snapshot for review. Not submitted to NDIA automatically.",
  },
  {
    id: "no_clinical_paste",
    label:
      "I confirm I have not pasted clinical records or NDIS plan documents into this form",
    description: "Use a secure MapAble pathway if those records are required.",
  },
];

type Step =
  | "welcome"
  | "areas"
  | "intensity"
  | "priority"
  | "details"
  | "done";

type AreaAnswer = {
  domainId: SupportNeedsLifeAreaId;
  intensity: SupportNeedsIntensity;
};

function intensityLabel(value: SupportNeedsIntensity): string {
  return (
    SUPPORT_NEEDS_INTENSITY_OPTIONS.find((o) => o.value === value)?.label ??
    value
  );
}

function areaLabel(id: SupportNeedsLifeAreaId): string {
  return SUPPORT_NEEDS_LIFE_AREAS.find((a) => a.id === id)?.label ?? id;
}

export function SupportNeedsAssessor() {
  const router = useRouter();
  const headingId = useId();
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  const [step, setStep] = useState<Step>("welcome");
  const [selectedAreas, setSelectedAreas] = useState<SupportNeedsLifeAreaId[]>(
    [],
  );
  const [answers, setAnswers] = useState<AreaAnswer[]>([]);
  const [intensityIndex, setIntensityIndex] = useState(0);
  const [priorityArea, setPriorityArea] = useState<
    SupportNeedsLifeAreaId | undefined
  >(undefined);
  const [anythingElse, setAnythingElse] = useState("");
  const [consentIds, setConsentIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [step, intensityIndex]);

  const currentArea = selectedAreas[intensityIndex];
  const progressLabel = useMemo(() => {
    switch (step) {
      case "welcome":
        return "Step 1 of 5 — Welcome";
      case "areas":
        return "Step 2 of 5 — Life areas";
      case "intensity":
        return `Step 3 of 5 — Support level (${intensityIndex + 1} of ${selectedAreas.length || 1})`;
      case "priority":
        return "Step 4 of 5 — What matters most";
      case "details":
        return "Step 5 of 5 — Details & consent";
      case "done":
        return "Complete";
      default: {
        const _exhaustive: never = step;
        return _exhaustive;
      }
    }
  }, [step, intensityIndex, selectedAreas.length]);

  function toggleArea(id: SupportNeedsLifeAreaId) {
    setSelectedAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  }

  function setIntensityForCurrent(intensity: SupportNeedsIntensity) {
    if (!currentArea) return;
    setAnswers((prev) => {
      const without = prev.filter((a) => a.domainId !== currentArea);
      return [...without, { domainId: currentArea, intensity }];
    });
  }

  function currentIntensity(): SupportNeedsIntensity | undefined {
    return answers.find((a) => a.domainId === currentArea)?.intensity;
  }

  async function submit(skipped: boolean) {
    setError("");
    setPending(true);
    try {
      const body = skipped
        ? { skipped: true as const }
        : {
            selectedAreas,
            answers,
            priorityArea,
            anythingElse: anythingElse.trim() || undefined,
            consentDraftProcessing: true as const,
            consentNoClinicalPaste: true as const,
            clientSessionId: `registration_assessor_${crypto.randomUUID().slice(0, 12)}`,
          };

      const res = await fetch("/api/participants/support-needs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        error?: string;
        notice?: string;
      };

      if (!res.ok) {
        setError(data.error || "Unable to save your support needs snapshot");
        setPending(false);
        return;
      }

      setNotice(data.notice || "Saved.");
      setStep("done");
      setPending(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  function goDashboard() {
    router.push("/dashboard");
    router.refresh();
  }

  const panelClass = cn(
    "space-y-5 rounded-2xl border border-border/70 bg-background/80 p-5 sm:p-7",
    !reduceMotion && "transition-opacity duration-300",
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:py-12">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Support needs
        </p>
        <h1 id={headingId} className="text-2xl font-bold tracking-tight sm:text-3xl">
          What support do you need?
        </h1>
        <p className="text-sm leading-6 text-muted-foreground" aria-live="polite">
          {progressLabel}
        </p>
      </header>

      <SensitiveDataBanner />

      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      {step === "welcome" ? (
        <section aria-labelledby="sna-welcome-heading" className={panelClass}>
          <h2
            id="sna-welcome-heading"
            ref={stepHeadingRef}
            tabIndex={-1}
            className="text-lg font-semibold outline-none"
          >
            A quick snapshot — not an NDIA claim
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Pick the life areas where you need support. We&apos;ll use this to
            prepare your MapAble planning draft. You can change it later, and
            nothing is sent to the NDIA from this step.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="default"
              size="lg"
              onClick={() => setStep("areas")}
              disabled={pending}
            >
              Start snapshot
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => void submit(true)}
              disabled={pending}
              loading={pending}
            >
              I&apos;ll do this later
            </Button>
          </div>
        </section>
      ) : null}

      {step === "areas" ? (
        <section aria-labelledby="sna-areas-heading" className={panelClass}>
          <h2
            id="sna-areas-heading"
            ref={stepHeadingRef}
            tabIndex={-1}
            className="text-lg font-semibold outline-none"
          >
            Which areas matter for you?
          </h2>
          <p className="text-sm text-muted-foreground">
            Select all that apply. You can choose more than one.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {SUPPORT_NEEDS_LIFE_AREAS.map((area) => {
              const selected = selectedAreas.includes(area.id);
              return (
                <li key={area.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleArea(area.id)}
                    className={cn(
                      "flex min-h-[5.5rem] w-full flex-col items-start rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-input bg-background hover:bg-muted/60",
                    )}
                  >
                    <span className="font-semibold">{area.label}</span>
                    <span className="mt-1 text-xs leading-5 text-muted-foreground">
                      {area.description}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={() => {
                if (selectedAreas.length === 0) {
                  setError("Select at least one life area, or skip for later.");
                  return;
                }
                setError("");
                setIntensityIndex(0);
                setStep("intensity");
              }}
              disabled={pending}
            >
              Continue
            </Button>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => setStep("welcome")}
              disabled={pending}
            >
              Back
            </Button>
          </div>
        </section>
      ) : null}

      {step === "intensity" && currentArea ? (
        <section
          aria-labelledby="sna-intensity-heading"
          className={panelClass}
        >
          <h2
            id="sna-intensity-heading"
            ref={stepHeadingRef}
            tabIndex={-1}
            className="text-lg font-semibold outline-none"
          >
            How much support with {areaLabel(currentArea).toLowerCase()}?
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose the option that fits most days.
          </p>
          <fieldset className="space-y-2">
            <legend className="sr-only">Support level</legend>
            <div className="grid gap-2">
              {SUPPORT_NEEDS_INTENSITY_OPTIONS.map((option) => {
                const checked = currentIntensity() === option.value;
                return (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 focus-within:ring-2 focus-within:ring-ring",
                      checked
                        ? "border-primary bg-primary/10"
                        : "border-input hover:bg-muted/50",
                    )}
                  >
                    <input
                      type="radio"
                      name={`intensity-${currentArea}`}
                      value={option.value}
                      checked={checked}
                      onChange={() => setIntensityForCurrent(option.value)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold">{option.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={() => {
                if (!currentIntensity()) {
                  setError("Choose a support level to continue.");
                  return;
                }
                setError("");
                if (intensityIndex < selectedAreas.length - 1) {
                  setIntensityIndex((i) => i + 1);
                } else {
                  setStep("priority");
                }
              }}
              disabled={pending}
            >
              Continue
            </Button>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => {
                if (intensityIndex > 0) {
                  setIntensityIndex((i) => i - 1);
                } else {
                  setStep("areas");
                }
              }}
              disabled={pending}
            >
              Back
            </Button>
          </div>
        </section>
      ) : null}

      {step === "priority" ? (
        <section
          aria-labelledby="sna-priority-heading"
          className={panelClass}
        >
          <h2
            id="sna-priority-heading"
            ref={stepHeadingRef}
            tabIndex={-1}
            className="text-lg font-semibold outline-none"
          >
            What matters most right now?
          </h2>
          <p className="text-sm text-muted-foreground">
            Optional — pick one priority so we know where to start.
          </p>
          <fieldset className="space-y-2">
            <legend className="sr-only">Priority life area</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {selectedAreas.map((id) => {
                const checked = priorityArea === id;
                return (
                  <label
                    key={id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 focus-within:ring-2 focus-within:ring-ring",
                      checked
                        ? "border-primary bg-primary/10"
                        : "border-input hover:bg-muted/50",
                    )}
                  >
                    <input
                      type="radio"
                      name="priority-area"
                      value={id}
                      checked={checked}
                      onChange={() => setPriorityArea(id)}
                    />
                    <span className="font-medium">{areaLabel(id)}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={() => setStep("details")}
              disabled={pending}
            >
              Continue
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="default"
              onClick={() => {
                setPriorityArea(undefined);
                setStep("details");
              }}
              disabled={pending}
            >
              Skip priority
            </Button>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => {
                setIntensityIndex(Math.max(0, selectedAreas.length - 1));
                setStep("intensity");
              }}
              disabled={pending}
            >
              Back
            </Button>
          </div>
        </section>
      ) : null}

      {step === "details" ? (
        <section
          aria-labelledby="sna-details-heading"
          className={panelClass}
        >
          <h2
            id="sna-details-heading"
            ref={stepHeadingRef}
            tabIndex={-1}
            className="text-lg font-semibold outline-none"
          >
            Anything else we should know?
          </h2>
          <AccessibleFormField
            id="sna-anything-else"
            label="Optional notes"
            hint="Keep this short. Do not paste clinical records or plan documents here."
          >
            <textarea
              id="sna-anything-else"
              value={anythingElse}
              onChange={(e) => setAnythingElse(e.target.value.slice(0, 2000))}
              maxLength={2000}
              rows={4}
              className={formInputClass}
              disabled={pending}
            />
          </AccessibleFormField>

          <ConsentScopeCheckbox
            scopes={CONSENT_SCOPES}
            checkedIds={consentIds}
            onChange={setConsentIds}
            legend="Before we save"
            requiredScopeIds={["draft_processing", "no_clinical_paste"]}
            error={
              consentIds.length < 2 && error.includes("consent")
                ? error
                : undefined
            }
          />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="default"
              size="lg"
              onClick={() => {
                if (
                  !consentIds.includes("draft_processing") ||
                  !consentIds.includes("no_clinical_paste")
                ) {
                  setError("Please confirm both consent items before saving.");
                  return;
                }
                void submit(false);
              }}
              disabled={pending}
              loading={pending}
            >
              Save snapshot
            </Button>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => setStep("priority")}
              disabled={pending}
            >
              Back
            </Button>
          </div>
        </section>
      ) : null}

      {step === "done" ? (
        <section aria-labelledby="sna-done-heading" className={panelClass}>
          <h2
            id="sna-done-heading"
            ref={stepHeadingRef}
            tabIndex={-1}
            className="text-lg font-semibold outline-none"
          >
            {answers.length > 0 ? "Your support snapshot" : "You can finish later"}
          </h2>
          {notice ? (
            <p className="text-sm text-muted-foreground">{notice}</p>
          ) : null}
          {answers.length > 0 ? (
            <ul className="flex flex-wrap gap-2" aria-label="Selected support areas">
              {answers.map((a) => (
                <li
                  key={a.domainId}
                  className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-sm font-medium"
                >
                  {areaLabel(a.domainId)}
                  <span className="text-muted-foreground">
                    {" "}
                    · {intensityLabel(a.intensity)}
                  </span>
                  {priorityArea === a.domainId ? (
                    <span className="text-primary"> · priority</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={goDashboard}
          >
            Continue to dashboard
          </Button>
        </section>
      ) : null}
    </div>
  );
}
