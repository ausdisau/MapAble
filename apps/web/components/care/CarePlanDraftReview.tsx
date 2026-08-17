"use client";

import { useState } from "react";

import { AuthAlert } from "@/components/auth/AuthAlert";
import { ParticipantConfirmationCard } from "@/components/care/ParticipantConfirmationCard";
import { supportTypeLabel } from "@/components/care/SupportTypeChips";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { classifySupportCategories } from "@/lib/care/support-category-classifier";
import type { CareSupportTransformOutput } from "@/server/agents/care/types";

export function CarePlanDraftReview({
  output,
  onBack,
  onConfirm,
  confirming,
  error,
}: {
  output: CareSupportTransformOutput;
  onBack: () => void;
  onConfirm: () => void;
  confirming: boolean;
  error: string | null;
}) {
  const [categoriesConfirmed, setCategoriesConfirmed] = useState(false);
  const { carePlanDraft, guardrailDecision } = output;
  const categorySuggestions = classifySupportCategories({
    message: carePlanDraft.description,
    requestType: carePlanDraft.requestType,
    taskNames: carePlanDraft.tasks.map((t) => t.name),
  });

  return (
    <div className="space-y-6">
      <AuthAlert variant="info">
        Nothing is booked and no worker is assigned until you confirm this
        draft. Providers only see details after you approve.
      </AuthAlert>

      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Summary for you
        </h3>
        <p className="mt-2 text-sm leading-relaxed">
          {output.participantFacingSummary}
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-border/60 p-4">
        <h3 className="font-semibold">{carePlanDraft.title}</h3>
        <p className="text-sm text-muted-foreground">
          {supportTypeLabel(carePlanDraft.requestType)} ·{" "}
          {carePlanDraft.bookingStatus.replace(/_/g, " ")}
        </p>
        <p className="text-sm">{carePlanDraft.description}</p>
        {carePlanDraft.tasks.length > 0 ? (
          <ul className="list-inside list-disc space-y-1 text-sm">
            {carePlanDraft.tasks.map((task, i) => (
              <li key={`${task.name}-${i}`}>
                {task.name}
                {task.intensity === "high" ? (
                  <span className="text-muted-foreground">
                    {" "}
                    (higher intensity)
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {output.requiredCapabilities.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold">Worker capabilities to match</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Informational only — MapAble does not assign workers automatically.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {output.requiredCapabilities.map((cap) => (
              <Badge
                key={cap.id}
                variant="outline"
                className="border-primary/20 bg-primary/5 text-primary"
              >
                {cap.label}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {output.missingInformation.length > 0 ? (
        <AuthAlert variant="warning">
          <span className="font-medium">You may want to add:</span>
          <ul className="mt-2 list-inside list-disc">
            {output.missingInformation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </AuthAlert>
      ) : null}

      {output.checkpoints.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Before booking</h3>
          {output.checkpoints.map((cp) => (
            <div
              key={cp.id}
              className="rounded-lg border border-border/50 bg-card px-3 py-2 text-sm"
            >
              <p className="font-medium">{cp.title}</p>
              <p className="text-muted-foreground">{cp.explanation}</p>
            </div>
          ))}
        </div>
      ) : null}

      <ParticipantConfirmationCard
        categorySuggestions={categorySuggestions}
        onConfirm={() => setCategoriesConfirmed(true)}
        confirming={false}
      />
      {categoriesConfirmed ? (
        <AuthAlert variant="info">Support categories confirmed (draft).</AuthAlert>
      ) : null}

      {guardrailDecision.humanReviewRequired ? (
        <AuthAlert variant="warning">
          A team member may review this request because it involves safety-related
          support. You can still save your draft now.
        </AuthAlert>
      ) : null}

      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={onBack}
          disabled={confirming}
        >
          Back to edit
        </Button>
        <Button
          type="button"
          variant="default"
          size="lg"
          className="min-w-[12rem]"
          onClick={onConfirm}
          disabled={confirming || !categoriesConfirmed}
          loading={confirming}
        >
          {confirming ? "Saving draft…" : "Confirm and save request"}
        </Button>
      </div>
    </div>
  );
}
