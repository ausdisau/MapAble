"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { intentLabel } from "@/lib/copilot/intentRouter";
import type { CopilotAskResponse } from "@/lib/copilot/types";
import { MOCK_PARTICIPANT_ID } from "@/lib/prms/mockPrmsData";

import { ConfirmationGatePanel } from "./ConfirmationGate";
import { CopilotActionCards } from "./CopilotActionCards";
import { CopilotWarnings } from "./CopilotWarnings";
import { DraftRecordCards } from "./DraftRecordCards";
import { PlainLanguageSummary } from "./PlainLanguageSummary";

const MODES = ["All", "Support", "Transport", "NDIS", "Jobs", "Help"] as const;

type Props = {
  /** Demo participant — replace with session participant when auth is wired. */
  demoParticipantId?: string;
  /** Prefill from URL e.g. /ask?provider=slug */
  initialQuery?: string;
  /** Safe model display name (e.g. gpt-oss-120b) when that engine powers replies. */
  modelLabel?: string;
};

export function CopilotPanel({
  demoParticipantId = MOCK_PARTICIPANT_ID,
  initialQuery,
  modelLabel,
}: Props) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [mode, setMode] = useState<string>("All");
  const [useParticipant, setUseParticipant] = useState(true);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CopilotAskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mapable/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          mode,
          participantId: useParticipant ? demoParticipantId : undefined,
          sessionId: `web-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        setResponse(null);
        return;
      }
      setResponse(data as CopilotAskResponse);
    } catch {
      setError("Could not reach MapAble. Check your connection and try again.");
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }, [query, mode, useParticipant, demoParticipantId]);

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardContent className="space-y-4 pt-6">
          <label htmlFor="ask-query" className="block text-sm font-medium">
            Ask MapAble
          </label>
          <textarea
            id="ask-query"
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="e.g. I need a support worker and wheelchair transport to physio next Tuesday morning"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Mode</legend>
            <div className="flex flex-wrap gap-2">
              {MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`min-h-11 rounded-lg border px-4 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring ${
                    mode === m
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-accent"
                  }`}
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useParticipant}
              onChange={(e) => setUseParticipant(e.target.checked)}
              className="size-5 rounded border-input"
            />
            Use demo participant context (signed-in preview)
          </label>
          <Button
            type="button"
            variant="default"
            size="lg"
            loading={loading}
            onClick={() => void ask()}
          >
            Ask
          </Button>
          {modelLabel === "gpt-oss-120b" ? (
            <p className="text-xs text-muted-foreground" role="note">
              Responses powered by gpt-oss-120b
            </p>
          ) : null}
        </CardContent>
      </Card>

      {error ? (
        <p className="text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {response ? (
        <div className="space-y-8">
          <PlainLanguageSummary
            summary={response.summary}
            answer={response.answer}
            intentLabel={intentLabel(response.intent)}
          />
          <CopilotWarnings warnings={response.warnings} />
          <CopilotActionCards
            actions={response.actions}
            blockedActions={response.blockedActions}
          />
          <DraftRecordCards records={response.draftRecords} />
          <ConfirmationGatePanel
            gates={response.requiredConfirmations}
            draftRecords={response.draftRecords}
            participantId={useParticipant ? demoParticipantId : undefined}
          />
        </div>
      ) : null}
    </div>
  );
}
