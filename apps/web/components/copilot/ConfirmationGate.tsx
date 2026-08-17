"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConfirmationGate as Gate } from "@/lib/copilot/types";
import type { DraftPrmsRecord } from "@/lib/prms/types";

type Props = {
  gates: Gate[];
  draftRecords: DraftPrmsRecord[];
  participantId?: string;
  onConfirmed?: (message: string) => void;
};

export function ConfirmationGatePanel({
  gates,
  draftRecords,
  participantId,
  onConfirmed,
}: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (gates.length === 0 && draftRecords.length === 0) return null;

  async function handleConfirm() {
    if (!participantId || draftRecords.length === 0) {
      setStatus("Sign in with a demo participant to confirm records.");
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      let lastMessage = "";
      for (const draft of draftRecords) {
        const createRes = await fetch("/api/prms/actions/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId,
            type: draft.type,
            payload: draft.payload,
          }),
        });
        const created = await createRes.json();
        if (!createRes.ok) {
          throw new Error(created.error ?? "Draft failed");
        }

        const confirmRes = await fetch("/api/prms/actions/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            draftId: created.draft.id,
            confirmedBy: "participant",
          }),
        });
        const confirmed = await confirmRes.json();
        if (!confirmRes.ok) {
          throw new Error(confirmed.error ?? "Confirm failed");
        }
        lastMessage = confirmed.message;
      }
      setStatus(lastMessage || "Records confirmed.");
      onConfirmed?.(lastMessage);
    } catch (e) {
      setStatus(
        e instanceof Error ? e.message : "Could not confirm. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="confirmation-gate-heading">
      <h3 id="confirmation-gate-heading" className="mb-3 text-base font-semibold">
        Before we continue
      </h3>
      <Card variant="gradient">
        <CardHeader>
          <CardTitle className="text-base">Your confirmation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {gates.map((gate) => (
              <li key={gate.type}>
                <span className="font-medium">{gate.title}</span>
                <p className="text-muted-foreground">{gate.explanation}</p>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="default"
              size="lg"
              loading={loading}
              onClick={() => void handleConfirm()}
            >
              Confirm draft
            </Button>
            <Button type="button" variant="outline" size="lg">
              Save draft
            </Button>
            <Button type="button" variant="outline" size="lg">
              Cancel
            </Button>
          </div>
          {status ? (
            <p className="text-sm font-medium" role="status">
              {status}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
