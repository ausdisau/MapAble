"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { AuthAlert } from "@/components/auth/AuthAlert";
import { CarePlanDraftReview } from "@/components/care/CarePlanDraftReview";
import {
  SupportTypeChips,
  type CareRequestTypeValue,
} from "@/components/care/SupportTypeChips";
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
  composeCareSupportMessage,
  type CareIntakeTaskRow,
} from "@/lib/care/compose-care-message";
import type { CareSupportTransformOutput } from "@/server/agents/care/types";

const CARE_CONSENT_SCOPES: ConsentScopeOption[] = [
  {
    id: "care_draft_processing",
    label: "MapAble may process this support description to prepare my draft plan",
    description: "Used only to generate and show your draft for review.",
  },
  {
    id: "no_sensitive_upload",
    label:
      "I confirm I have not pasted NDIS plan documents or clinical records into this form",
    description: "Use a secure MapAble pathway if those records are required.",
  },
];

function newSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}`;
}

function emptyTask(): CareIntakeTaskRow {
  return { name: "", intensity: "standard" };
}

function focusField(id: string) {
  const el = document.getElementById(id);
  if (el instanceof HTMLElement) {
    el.focus();
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

export function CareRequestWizard({
  redirectBase = "/care",
  participantId,
  preferredOrganisationId,
  preferredProviderName,
}: {
  redirectBase?: string;
  participantId?: string;
  preferredOrganisationId?: string;
  preferredProviderName?: string;
}) {
  const router = useRouter();
  const sessionId = useMemo(() => newSessionId(), []);

  const [step, setStep] = useState<"describe" | "review">("describe");
  const [requestType, setRequestType] =
    useState<CareRequestTypeValue>("personal_care");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [tasks, setTasks] = useState<CareIntakeTaskRow[]>([
    { name: "", intensity: "standard" },
  ]);
  const [shareAccessibility, setShareAccessibility] = useState(false);
  const [accessSummary, setAccessSummary] = useState("");
  const [linkedTransport, setLinkedTransport] = useState(false);
  const [consentIds, setConsentIds] = useState<string[]>([]);
  const [consentError, setConsentError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transformOutput, setTransformOutput] =
    useState<CareSupportTransformOutput | null>(null);

  const assessmentSignals = useMemo(() => {
    const signals: Record<string, unknown> = {};
    if (tasks.some((t) => t.intensity === "high")) {
      signals.manualHandling = true;
    }
    return signals;
  }, [tasks]);

  async function handleContinueToReview(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setConsentError(null);

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (trimmedTitle.length < 3) {
      setError("Please add a short title (at least 3 characters).");
      queueMicrotask(() => focusField("care-title"));
      return;
    }
    if (trimmedDescription.length < 1) {
      setError("Please describe what support you need.");
      queueMicrotask(() => focusField("care-description"));
      return;
    }

    const taskRows = tasks
      .map((t) => ({ ...t, name: t.name.trim() }))
      .filter((t) => t.name.length > 0);
    if (taskRows.length === 0) {
      setError("Add at least one support task, or describe tasks in your details.");
      queueMicrotask(() => focusField("task-name-0"));
      return;
    }

    if (!consentIds.includes("care_draft_processing")) {
      setConsentError(
        "Confirm MapAble may process this description to prepare your draft.",
      );
      queueMicrotask(() => focusField("care-consent-legend"));
      return;
    }
    if (!consentIds.includes("no_sensitive_upload")) {
      setConsentError(
        "Confirm you have not pasted NDIS plan or clinical records into this form.",
      );
      queueMicrotask(() => focusField("care-consent-legend"));
      return;
    }

    if (shareAccessibility && accessSummary.trim().length < 3) {
      setError("Add a brief access needs summary, or untick sharing.");
      queueMicrotask(() => focusField("care-access"));
      return;
    }

    setLoading(true);
    try {
      const message = composeCareSupportMessage({
        requestType,
        title: trimmedTitle,
        description: trimmedDescription,
        tasks: taskRows,
        address: address.trim() || undefined,
        linkedTransportRequired: linkedTransport,
        shareAccessibility,
        accessRequirementsSummary: accessSummary.trim() || undefined,
      });

      const res = await fetch("/api/care-support-transformer/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message,
          participantId,
          assessmentSignals,
          preferences: {
            shareAccessibility,
            shareAccessibilityConfirmed: shareAccessibility,
            linkedTransportRequired: linkedTransport,
            accessRequirementsSummary: accessSummary.trim() || undefined,
          },
          consentScopes: consentIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not prepare your care plan draft.");
        setLoading(false);
        return;
      }

      setTransformOutput(data as CareSupportTransformOutput);
      setStep("review");
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleConfirmSave() {
    if (!transformOutput) return;
    setConfirming(true);
    setError(null);

    const draft = transformOutput.carePlanDraft;
    const payload = {
      requestType: draft.requestType,
      title: draft.title,
      description: draft.description,
      address: address.trim() || undefined,
      linkedTransportRequired: draft.linkedTransportRequired,
      shareAccessibility: draft.shareAccessibility,
      shareAccessibilityConfirmed:
        draft.shareAccessibility && draft.shareAccessibilityConfirmed,
      accessRequirementsSummary: draft.accessRequirementsSummary,
      tasks: draft.tasks.map((t) => ({
        name: t.name,
        intensity: t.intensity,
      })),
    };

    try {
      const res = await fetch("/api/care/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save your request.");
        setConfirming(false);
        return;
      }

      const id = data.request?.id as string | undefined;
      let redirectTo = `${redirectBase}/bookings`;
      if (id) {
        const submitRes = await fetch(`/api/care/requests/${id}/submit`, {
          method: "POST",
        });
        const submitData = (await submitRes.json()) as {
          redirectTo?: string;
          matchingSkipped?: boolean;
        };
        if (submitRes.ok && submitData.redirectTo) {
          redirectTo = submitData.redirectTo;
        }
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Could not save your request. Please try again.");
      setConfirming(false);
    }
  }

  if (step === "review" && transformOutput) {
    return (
      <CarePlanDraftReview
        output={transformOutput}
        onBack={() => {
          setStep("describe");
          setError(null);
        }}
        onConfirm={() => void handleConfirmSave()}
        confirming={confirming}
        error={error}
      />
    );
  }

  return (
    <form className="space-y-6" onSubmit={(e) => void handleContinueToReview(e)}>
      {preferredProviderName ? (
        <AuthAlert variant="info">
          You are requesting care with a preference for{" "}
          <strong>{preferredProviderName}</strong>. MapAble will use this when
          matching and assigning your request
          {preferredOrganisationId ? " to a verified provider on the platform" : ""}
          .
        </AuthAlert>
      ) : null}

      <AuthAlert variant="info">
        Describe what you need in everyday language. You will review a draft
        plan before anything is shared with providers. Pricing and worker
        matching come after you confirm — no surprises at this step.
      </AuthAlert>

      <SensitiveDataBanner id="care-sensitive-data-banner" />

      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <fieldset className="space-y-3" disabled={loading}>
        <legend className="text-sm font-medium">What type of support?</legend>
        <SupportTypeChips
          value={requestType}
          onChange={setRequestType}
          disabled={loading}
        />
      </fieldset>

      <AccessibleFormField id="care-title" label="Short title" required>
        <input
          id="care-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={formInputClass}
          placeholder="e.g. Morning personal care on Tuesdays"
          required
          disabled={loading}
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="care-description"
        label="Tell us what you need"
        required
        hint="Include timing, location, and anything important for the support worker. Do not paste NDIS plan PDFs or clinical records."
      >
        <textarea
          id="care-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={formInputClass}
          rows={4}
          required
          disabled={loading}
          aria-describedby="care-sensitive-data-banner"
        />
      </AccessibleFormField>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Support tasks</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || tasks.length >= 8}
            onClick={() => setTasks((prev) => [...prev, emptyTask()])}
          >
            Add task
          </Button>
        </div>
        {tasks.map((task, index) => (
          <div
            key={`task-${index}`}
            className="flex flex-col gap-2 rounded-xl border border-border/50 p-3 sm:flex-row sm:items-end"
          >
            <div className="min-w-0 flex-1">
              <label
                htmlFor={`task-name-${index}`}
                className="text-xs font-medium text-muted-foreground"
              >
                Task {index + 1}
              </label>
              <input
                id={`task-name-${index}`}
                value={task.name}
                onChange={(e) =>
                  setTasks((prev) =>
                    prev.map((t, i) =>
                      i === index ? { ...t, name: e.target.value } : t
                    )
                  )
                }
                className={formInputClass}
                placeholder="e.g. Help with shower and dressing"
                disabled={loading}
              />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={task.intensity === "high"}
                  onChange={(e) =>
                    setTasks((prev) =>
                      prev.map((t, i) =>
                        i === index
                          ? {
                              ...t,
                              intensity: e.target.checked ? "high" : "standard",
                            }
                          : t
                      )
                    )
                  }
                  disabled={loading}
                />
                Higher intensity
              </label>
              {tasks.length > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() =>
                    setTasks((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <AccessibleFormField id="care-address" label="Suburb or address (optional)">
        <input
          id="care-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={formInputClass}
          disabled={loading}
        />
      </AccessibleFormField>

      <div className="space-y-3 rounded-xl border border-dashed border-border/70 bg-muted/20 p-4">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={shareAccessibility}
            onChange={(e) => setShareAccessibility(e.target.checked)}
            disabled={loading}
            className="mt-1"
          />
          <span>
            Share accessibility or access notes with an assigned provider (only
            after you confirm — requires consent)
          </span>
        </label>
        {shareAccessibility ? (
          <AccessibleFormField
            id="care-access"
            label="Access needs summary"
            hint="Minimum necessary detail only."
          >
            <textarea
              id="care-access"
              value={accessSummary}
              onChange={(e) => setAccessSummary(e.target.value)}
              className={formInputClass}
              rows={2}
              disabled={loading}
            />
          </AccessibleFormField>
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={linkedTransport}
            onChange={(e) => setLinkedTransport(e.target.checked)}
            disabled={loading}
          />
          I may also need transport linked to this support
        </label>
      </div>

      <div id="care-consent-legend" tabIndex={-1}>
        <ConsentScopeCheckbox
          scopes={CARE_CONSENT_SCOPES}
          checkedIds={consentIds}
          onChange={(ids) => {
            setConsentIds(ids);
            setConsentError(null);
          }}
          requiredScopeIds={["care_draft_processing", "no_sensitive_upload"]}
          error={consentError ?? undefined}
          legend="Consent before preparing your draft"
        />
      </div>

      <Button
        type="submit"
        variant="default"
        size="lg"
        className="w-full sm:w-auto"
        disabled={loading}
        loading={loading}
      >
        {loading ? "Preparing your draft…" : "Continue to review"}
      </Button>
    </form>
  );
}
