"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import type {
  CareTransportMapAction,
  CopilotAskResponse,
} from "@/lib/copilot/types";

const STARTERS = [
  "Care providers near Parramatta",
  "Show accessible pickup points in Sydney",
  "Add a care support hub in Newcastle",
];

type Props = {
  onMapActions: (actions: CareTransportMapAction[]) => void;
  className?: string;
};

export function CareTransportAskPanel({ onMapActions, className }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [addHref, setAddHref] = useState<string | null>(null);

  const ask = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setLoading(true);
      setError(null);
      setAddHref(null);
      try {
        const res = await fetch("/api/mapable/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: trimmed,
            mode: "Places",
            context: "care_transport_map",
            sessionId: `care-transport-map-${Date.now()}`,
          }),
        });
        const data = (await res.json()) as CopilotAskResponse & {
          error?: string;
        };
        if (!res.ok) {
          setError(data.error ?? "Request failed");
          setAnswer(null);
          return;
        }
        setAnswer(data.answer);
        const actions = data.mapActions ?? [];
        onMapActions(actions);
        const suggest = actions.find((a) => a.type === "suggestInfrastructure");
        if (suggest && suggest.type === "suggestInfrastructure") {
          setAddHref(suggest.href);
        }
      } catch {
        setError("Could not reach MapAble. Check your connection and try again.");
        setAnswer(null);
      } finally {
        setLoading(false);
      }
    },
    [onMapActions],
  );

  return (
    <aside className={className} aria-label="Ask MapAble about this map">
      <h2 className="font-heading text-lg font-semibold">Ask MapAble</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Move the map, toggle layers, or draft an infrastructure suggestion.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {STARTERS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-left text-xs hover:bg-muted"
            disabled={loading}
            onClick={() => {
              setQuery(prompt);
              void ask(prompt);
            }}
          >
            {prompt}
          </button>
        ))}
      </div>
      <label htmlFor="care-transport-ask" className="mt-4 block text-sm font-medium">
        Your question
      </label>
      <textarea
        id="care-transport-ask"
        rows={3}
        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. Care providers near Parramatta"
      />
      <Button
        type="button"
        variant="default"
        size="default"
        className="mt-3"
        loading={loading}
        onClick={() => void ask(query)}
      >
        Ask
      </Button>
      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {answer ? (
        <p className="mt-3 text-sm text-foreground" role="status">
          {answer}
        </p>
      ) : null}
      {addHref ? (
        <p className="mt-3 text-sm">
          <Link href={addHref} className="underline focus-visible:ring-2">
            Open Add infrastructure
          </Link>
        </p>
      ) : null}
    </aside>
  );
}
