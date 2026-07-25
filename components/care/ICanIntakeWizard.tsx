"use client";

import { useEffect, useId, useMemo, useRef } from "react";

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
import { useSubmitICanIntake } from "@/hooks/useSubmitICanIntake";
import { ICAN_V6_DOMAIN_META } from "@/lib/intake/i-can-domains";
import { useIntakeStore } from "@/lib/intake/use-intake-store";
import type {
  ICanV6DomainId,
  ICanV6Frequency,
  ICanV6SupportNeedLevel,
} from "@/lib/validation/i-can-v6";

/** Shell implements the first two domains; store covers all twelve. */
const SHELL_DOMAIN_IDS: readonly ICanV6DomainId[] = [
  "communication",
  "mobility",
] as const;

const SUPPORT_NEED_OPTIONS: {
  value: ICanV6SupportNeedLevel;
  label: string;
}[] = [
  { value: "none", label: "None" },
  { value: "intermittent", label: "Intermittent" },
  { value: "limited", label: "Limited" },
  { value: "extensive", label: "Extensive" },
  { value: "pervasive", label: "Pervasive" },
];

const FREQUENCY_OPTIONS: { value: ICanV6Frequency; label: string }[] = [
  { value: "never", label: "Never" },
  { value: "occasionally", label: "Occasionally" },
  { value: "regularly", label: "Regularly" },
  { value: "daily", label: "Daily" },
  { value: "constantly", label: "Constantly" },
];

const ICAN_CONSENT_SCOPES: ConsentScopeOption[] = [
  {
    id: "ican_draft_processing",
    label:
      "MapAble may process this I-CAN v6 intake to prepare my planning draft",
    description:
      "Used only to store and show your assessment draft for review. Not submitted to NDIA automatically.",
  },
  {
    id: "no_clinical_paste",
    label:
      "I confirm I have not pasted clinical records or NDIS plan documents into this form",
    description: "Use a secure MapAble pathway if those records are required.",
  },
];

function focusField(id: string) {
  const el = document.getElementById(id);
  if (el instanceof HTMLElement) {
    el.focus();
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

export function ICanIntakeWizard() {
  const headingId = useId();
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const currentStepIndex = useIntakeStore((s) => s.currentStepIndex);
  const domains = useIntakeStore((s) => s.domains);
  const consentDraftProcessing = useIntakeStore((s) => s.consentDraftProcessing);
  const consentNoClinicalPaste = useIntakeStore((s) => s.consentNoClinicalPaste);
  const updateDomain = useIntakeStore((s) => s.updateDomain);
  const setDomainCompleted = useIntakeStore((s) => s.setDomainCompleted);
  const setStep = useIntakeStore((s) => s.setStep);
  const nextStep = useIntakeStore((s) => s.nextStep);
  const prevStep = useIntakeStore((s) => s.prevStep);
  const setConsent = useIntakeStore((s) => s.setConsent);

  const { submit, pending, error, successId, notice } = useSubmitICanIntake();

  const shellStepIndex = Math.min(
    currentStepIndex,
    SHELL_DOMAIN_IDS.length - 1,
  );
  const domainId = SHELL_DOMAIN_IDS[shellStepIndex] ?? "communication";
  const domainMeta = useMemo(
    () => ICAN_V6_DOMAIN_META.find((d) => d.id === domainId),
    [domainId],
  );
  const entry = domains[domainId];

  const consentCheckedIds = [
    ...(consentDraftProcessing ? ["ican_draft_processing"] : []),
    ...(consentNoClinicalPaste ? ["no_clinical_paste"] : []),
  ];

  const canAdvance =
    entry.completed &&
    Boolean(entry.frequency) &&
    entry.supportNeedLevel !== undefined;

  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [shellStepIndex]);

  function handleConsentChange(nextIds: string[]) {
    setConsent({
      consentDraftProcessing: nextIds.includes("ican_draft_processing"),
      consentNoClinicalPaste: nextIds.includes("no_clinical_paste"),
    });
  }

  async function handleSubmit() {
    const result = await submit();
    if (result.ok) {
      focusField("ican-intake-status");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Participant intake
        </p>
        <h1 id={headingId} className="text-2xl font-bold tracking-tight">
          I-CAN v6 functional capacity intake
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Capture support needs across twelve daily-life domains for New
          Framework Planning preparation. This shell steps through Communication
          and Mobility; all twelve domains are stored in session progress.
        </p>
      </header>

      <SensitiveDataBanner />

      <nav aria-label="I-CAN domain steps">
        <ol className="flex flex-wrap gap-2">
          {SHELL_DOMAIN_IDS.map((id, index) => {
            const meta = ICAN_V6_DOMAIN_META.find((d) => d.id === id);
            const current = index === shellStepIndex;
            return (
              <li key={id}>
                <button
                  type="button"
                  className={`inline-flex min-h-11 items-center rounded-lg border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    current
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input bg-background text-foreground hover:bg-muted"
                  }`}
                  aria-current={current ? "step" : undefined}
                  onClick={() => setStep(index)}
                >
                  {index + 1}. {meta?.label ?? id}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
          Showing shell steps {shellStepIndex + 1} of {SHELL_DOMAIN_IDS.length}{" "}
          (of {ICAN_V6_DOMAIN_META.length} I-CAN domains in the store).
        </p>
      </nav>

      <section
        aria-labelledby="ican-domain-heading"
        className="space-y-4 rounded-xl border p-4 sm:p-6"
      >
        <h2
          id="ican-domain-heading"
          ref={stepHeadingRef}
          tabIndex={-1}
          className="text-lg font-semibold outline-none"
        >
          {domainMeta?.label ?? domainId}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {domainMeta?.description}
        </p>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Support need level</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SUPPORT_NEED_OPTIONS.map((option) => {
              const inputId = `ican-${domainId}-level-${option.value}`;
              return (
                <label
                  key={option.value}
                  htmlFor={inputId}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                >
                  <input
                    id={inputId}
                    type="radio"
                    name={`ican-${domainId}-level`}
                    value={option.value}
                    checked={entry.supportNeedLevel === option.value}
                    onChange={() =>
                      updateDomain(domainId, {
                        supportNeedLevel: option.value,
                      })
                    }
                    className="h-4 w-4"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <AccessibleFormField
          id={`ican-${domainId}-frequency`}
          label="How often is support needed?"
          required
        >
          <select
            id={`ican-${domainId}-frequency`}
            className={formInputClass}
            value={entry.frequency ?? ""}
            onChange={(e) =>
              updateDomain(domainId, {
                frequency: (e.target.value || undefined) as
                  | ICanV6Frequency
                  | undefined,
              })
            }
            required
          >
            <option value="">Select frequency</option>
            {FREQUENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </AccessibleFormField>

        <AccessibleFormField
          id={`ican-${domainId}-notes`}
          label="Notes (optional)"
          hint="Do not paste clinical reports or NDIS plan documents here."
        >
          <textarea
            id={`ican-${domainId}-notes`}
            className={formInputClass}
            rows={4}
            maxLength={2000}
            value={entry.notes}
            onChange={(e) =>
              updateDomain(domainId, { notes: e.target.value })
            }
          />
        </AccessibleFormField>

        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={entry.completed}
            onChange={(e) => setDomainCompleted(domainId, e.target.checked)}
            className="h-4 w-4"
          />
          Mark this domain complete for now
        </label>
      </section>

      <ConsentScopeCheckbox
        scopes={ICAN_CONSENT_SCOPES}
        checkedIds={consentCheckedIds}
        onChange={handleConsentChange}
        legend="Intake consent"
        requiredScopeIds={[
          "ican_draft_processing",
          "no_clinical_paste",
        ]}
      />

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={shellStepIndex === 0 || pending}
          onClick={() => {
            prevStep();
            focusField("ican-domain-heading");
          }}
        >
          Back
        </Button>
        {shellStepIndex < SHELL_DOMAIN_IDS.length - 1 ? (
          <Button
            type="button"
            disabled={!canAdvance || pending}
            onClick={() => {
              nextStep();
              focusField("ican-domain-heading");
            }}
          >
            Next domain
          </Button>
        ) : (
          <Button
            type="button"
            disabled={
              pending ||
              !canAdvance ||
              !consentDraftProcessing ||
              !consentNoClinicalPaste
            }
            loading={pending}
            onClick={() => void handleSubmit()}
          >
            {pending ? "Submitting…" : "Submit intake draft"}
          </Button>
        )}
      </div>

      {shellStepIndex === SHELL_DOMAIN_IDS.length - 1 ? (
        <p className="text-sm text-muted-foreground">
          Full submission requires all twelve I-CAN domains completed in the
          store (plus consent). This shell edits Communication and Mobility;
          remaining domains stay incomplete until filled by later steps or
          store hydration.
        </p>
      ) : null}

      <div id="ican-intake-status" tabIndex={-1} className="outline-none">
        <div aria-live="polite" className="space-y-2">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {successId ? (
            <AuthAlert variant="success">
              Intake stored (id {successId.slice(0, 8)}…).{" "}
              {notice ?? "Not submitted to NDIA."}
            </AuthAlert>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Progress is saved in this browser session only. Successful submit clears
        local session progress.
      </p>
    </div>
  );
}
