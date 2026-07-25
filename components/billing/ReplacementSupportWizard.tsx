"use client";

import { useMemo, useState } from "react";

import { cn } from "@/app/lib/utils";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatAud } from "@/lib/billing/money";
import {
  calculateSupportSavings,
  type ReplacementSupportCalculations,
} from "@/lib/billing/replacement-calculator";
import {
  DEFAULT_NDIS_HOURLY_WORKER_RATE_AUD,
  ICAN_V6_DOMAIN_LABELS,
  ICAN_V6_DOMAINS,
  type IcanV6Domain,
  type ReplacementSupportEvidencePack,
  type ReplacementSupportRequest,
} from "@/lib/billing/replacement-support";
import { mapableSectionCardClass } from "@/lib/brand/styles";

const STEPS = [
  "I-CAN domains & device",
  "Support hours replaced",
  "Savings projection",
  "Generate evidence pack",
] as const;

type WizardResponse = {
  evidencePackId: string;
  generatedAt: string;
  request: ReplacementSupportRequest;
  calculations: ReplacementSupportCalculations;
  evidencePack: ReplacementSupportEvidencePack;
  error?: string;
};

function parsePositiveNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function formatPaybackWeeks(weeks: number): string {
  if (!Number.isFinite(weeks)) return "N/A";
  if (weeks < 1) return `${weeks.toFixed(2)} weeks`;
  return `${weeks.toFixed(1)} weeks`;
}

export function ReplacementSupportWizard({
  participantId: initialParticipantId = "",
}: {
  participantId?: string;
}) {
  const [step, setStep] = useState(0);
  const [participantId, setParticipantId] = useState(initialParticipantId);
  const [selectedDomains, setSelectedDomains] = useState<IcanV6Domain[]>([]);
  const [deviceName, setDeviceName] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [hourlyRate, setHourlyRate] = useState(
    String(DEFAULT_NDIS_HOURLY_WORKER_RATE_AUD)
  );
  const [justificationNotes, setJustificationNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WizardResponse | null>(null);

  const projection = useMemo(() => {
    const hours = parsePositiveNumber(hoursPerWeek);
    const rate = parsePositiveNumber(hourlyRate);
    const cost = parsePositiveNumber(unitCost);
    if (hours == null || rate == null || cost == null) return null;
    try {
      return calculateSupportSavings({
        replacedSupportHoursPerWeek: hours,
        hourlyWorkerRateAUD: rate,
        unitCostAUD: cost,
      });
    } catch {
      return null;
    }
  }, [hoursPerWeek, hourlyRate, unitCost]);

  function toggleDomain(domain: IcanV6Domain) {
    setSelectedDomains((prev) =>
      prev.includes(domain)
        ? prev.filter((d) => d !== domain)
        : [...prev, domain]
    );
  }

  function validateStep(current: number): boolean {
    const errors: Record<string, string> = {};

    if (current === 0) {
      if (!participantId.trim()) {
        errors.participantId = "Enter a participant ID";
      }
      if (selectedDomains.length === 0) {
        errors.domains = "Select at least one I-CAN v6 domain";
      }
      if (!deviceName.trim()) {
        errors.deviceName = "Enter the device name";
      }
      if (!deviceModel.trim()) {
        errors.deviceModel = "Enter the device model";
      }
      if (parsePositiveNumber(unitCost) == null) {
        errors.unitCost = "Enter a positive unit cost in AUD";
      }
    }

    if (current === 1) {
      if (parsePositiveNumber(hoursPerWeek) == null) {
        errors.hoursPerWeek = "Enter positive hours per week";
      }
      if (parsePositiveNumber(hourlyRate) == null) {
        errors.hourlyRate = "Enter a positive hourly worker rate";
      }
      if (!justificationNotes.trim()) {
        errors.justificationNotes = "Add clinical justification notes";
      }
    }

    if (current === 2 && !projection) {
      errors.projection = "Complete device cost and support hours to project savings";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setSubmitError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setSubmitError("");
    setFieldErrors({});
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submitEvidencePack() {
    const step0Ok = validateStep(0);
    if (!step0Ok) {
      setStep(0);
      return;
    }
    const step1Ok = validateStep(1);
    if (!step1Ok) {
      setStep(1);
      return;
    }
    if (!projection) {
      setSubmitError("Savings projection is incomplete");
      setStep(2);
      return;
    }

    setLoading(true);
    setSubmitError("");
    setResult(null);

    const payload = {
      participantId: participantId.trim(),
      icanDomainDeficit: selectedDomains,
      proposedDevice: {
        name: deviceName.trim(),
        model: deviceModel.trim(),
        unitCostAUD: parsePositiveNumber(unitCost)!,
      },
      replacedSupportHoursPerWeek: parsePositiveNumber(hoursPerWeek)!,
      hourlyWorkerRateAUD: parsePositiveNumber(hourlyRate)!,
      justificationNotes: justificationNotes.trim(),
    };

    try {
      const res = await fetch("/api/billing/replacement-supports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as WizardResponse & {
        error?: string;
        details?: unknown;
      };
      if (!res.ok) {
        setSubmitError(data.error ?? "Could not generate evidence pack");
        setLoading(false);
        return;
      }
      setResult(data);
    } catch {
      setSubmitError("Network error while generating evidence pack");
    } finally {
      setLoading(false);
    }
  }

  function downloadEvidencePack() {
    if (!result) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            evidencePackId: result.evidencePackId,
            generatedAt: result.generatedAt,
            request: result.request,
            calculations: result.calculations,
            evidencePack: result.evidencePack,
          },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ndis-replacement-support-evidence-${result.evidencePackId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0C1833]">
          Replacement Support Evidence
        </h1>
        <p className="text-sm text-muted-foreground">
          Build a cost-benefit and clinical justification portfolio for NDIA or
          Plan Manager review of mainstream consumer devices as Replacement
          Supports.
        </p>
      </header>

      <nav aria-label="Replacement support wizard steps">
        <ol className="flex flex-wrap gap-2 text-sm">
          {STEPS.map((label, i) => (
            <li
              key={label}
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "rounded-lg px-2 py-1",
                i === step
                  ? "font-semibold text-[#005B7F] bg-[#005B7F]/10"
                  : "text-muted-foreground"
              )}
            >
              Step {i + 1}: {label}
            </li>
          ))}
        </ol>
      </nav>

      {submitError ? (
        <p role="alert" className="text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      {step === 0 ? (
        <section
          aria-labelledby="rs-step1-heading"
          className={cn(mapableSectionCardClass, "space-y-4 p-4 sm:p-6")}
        >
          <h2 id="rs-step1-heading" className="text-lg font-semibold">
            I-CAN domains and proposed device
          </h2>

          <AccessibleFormField
            id="rs-participant-id"
            label="Participant ID"
            required
            error={fieldErrors.participantId}
          >
            <input
              id="rs-participant-id"
              className={formInputClass}
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              autoComplete="off"
            />
          </AccessibleFormField>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">
              Target I-CAN v6 functional domains{" "}
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {ICAN_V6_DOMAINS.map((domain) => {
                const id = `rs-domain-${domain}`;
                const checked = selectedDomains.includes(domain);
                return (
                  <label
                    key={domain}
                    htmlFor={id}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                      checked
                        ? "border-[#005B7F] bg-[#005B7F]/5"
                        : "border-input bg-background"
                    )}
                  >
                    <input
                      id={id}
                      type="checkbox"
                      className="size-4 accent-[#005B7F]"
                      checked={checked}
                      onChange={() => toggleDomain(domain)}
                    />
                    <span>{ICAN_V6_DOMAIN_LABELS[domain]}</span>
                  </label>
                );
              })}
            </div>
            {fieldErrors.domains ? (
              <p role="alert" className="text-sm text-destructive">
                {fieldErrors.domains}
              </p>
            ) : null}
          </fieldset>

          <AccessibleFormField
            id="rs-device-name"
            label="Device name"
            required
            error={fieldErrors.deviceName}
          >
            <input
              id="rs-device-name"
              className={formInputClass}
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g. Apple Watch"
            />
          </AccessibleFormField>

          <AccessibleFormField
            id="rs-device-model"
            label="Device model"
            required
            error={fieldErrors.deviceModel}
          >
            <input
              id="rs-device-model"
              className={formInputClass}
              value={deviceModel}
              onChange={(e) => setDeviceModel(e.target.value)}
              placeholder="e.g. Series 10 GPS 46mm"
            />
          </AccessibleFormField>

          <AccessibleFormField
            id="rs-unit-cost"
            label="Unit cost (AUD)"
            required
            hint="Purchase price of the mainstream consumer device"
            error={fieldErrors.unitCost}
          >
            <input
              id="rs-unit-cost"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={formInputClass}
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
            />
          </AccessibleFormField>
        </section>
      ) : null}

      {step === 1 ? (
        <section
          aria-labelledby="rs-step2-heading"
          className={cn(mapableSectionCardClass, "space-y-4 p-4 sm:p-6")}
        >
          <h2 id="rs-step2-heading" className="text-lg font-semibold">
            Human support hours to be replaced
          </h2>

          <AccessibleFormField
            id="rs-hours"
            label="Support worker hours replaced per week"
            required
            error={fieldErrors.hoursPerWeek}
          >
            <input
              id="rs-hours"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.25"
              className={formInputClass}
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(e.target.value)}
            />
          </AccessibleFormField>

          <AccessibleFormField
            id="rs-rate"
            label="Hourly worker rate (AUD)"
            required
            hint={`Defaults to NDIS weekday daytime self-care cap ($${DEFAULT_NDIS_HOURLY_WORKER_RATE_AUD.toFixed(2)})`}
            error={fieldErrors.hourlyRate}
          >
            <input
              id="rs-rate"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={formInputClass}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
            />
          </AccessibleFormField>

          <AccessibleFormField
            id="rs-justification"
            label="Clinical justification notes"
            required
            hint="Describe how the device reduces or replaces physical support worker hours"
            error={fieldErrors.justificationNotes}
          >
            <textarea
              id="rs-justification"
              className={cn(formInputClass, "min-h-32")}
              value={justificationNotes}
              onChange={(e) => setJustificationNotes(e.target.value)}
              rows={5}
            />
          </AccessibleFormField>
        </section>
      ) : null}

      {step === 2 ? (
        <section aria-labelledby="rs-step3-heading" className="space-y-4">
          <h2 id="rs-step3-heading" className="sr-only">
            Savings projection
          </h2>
          {fieldErrors.projection ? (
            <p role="alert" className="text-sm text-destructive">
              {fieldErrors.projection}
            </p>
          ) : null}
          {projection ? (
            <Card variant="elevated" className="border-[#005B7F]/20">
              <CardHeader>
                <CardTitle>Real-time savings projection</CardTitle>
                <CardDescription>
                  Based on {hoursPerWeek} hours/week at $
                  {parsePositiveNumber(hourlyRate)?.toFixed(2)} AUD and a device
                  cost of ${parsePositiveNumber(unitCost)?.toFixed(2)} AUD.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Payback period</p>
                  <p className="text-2xl font-semibold text-[#005B7F]">
                    {formatPaybackWeeks(projection.paybackPeriodWeeks)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    1-year plan savings
                  </p>
                  <p className="text-2xl font-semibold text-[#005B7F]">
                    {formatAud(projection.net12MonthSavingsCents)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Weekly human support cost
                  </p>
                  <p className="text-lg font-medium">
                    {formatAud(projection.weeklyHumanSupportCostCents)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Annualised human support cost
                  </p>
                  <p className="text-lg font-medium">
                    {formatAud(projection.annualHumanSupportCostCents)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">
              Enter device cost and support hours to see a projection.
            </p>
          )}
        </section>
      ) : null}

      {step === 3 ? (
        <section
          aria-labelledby="rs-step4-heading"
          className={cn(mapableSectionCardClass, "space-y-4 p-4 sm:p-6")}
        >
          <h2 id="rs-step4-heading" className="text-lg font-semibold">
            Generate NDIS evidence pack
          </h2>
          <p className="text-sm text-muted-foreground">
            Submit to build a DRAFT_ONLY evidence JSON bundle for NDIA or Plan
            Manager review. Nothing is auto-approved or submitted.
          </p>

          {!result ? (
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={() => void submitEvidencePack()}
              loading={loading}
              disabled={loading}
            >
              Generate evidence pack
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm" role="status">
                Evidence pack ready (ID: {result.evidencePackId}). Generated at{" "}
                {new Date(result.generatedAt).toLocaleString("en-AU")}.
              </p>
              <Button
                type="button"
                variant="default"
                size="default"
                onClick={downloadEvidencePack}
              >
                Download NDIS Evidence Pack
              </Button>
            </div>
          )}
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={goBack}
          disabled={step === 0 || loading}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={goNext}
            disabled={loading}
          >
            Continue
          </Button>
        ) : null}
      </div>
    </div>
  );
}
