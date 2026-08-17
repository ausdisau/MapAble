"use client";

import { useEffect, useState } from "react";

import { HERO_SUGGESTED_SEARCHES_FALLBACK } from "@/lib/provider/finder/filters";
import { fetchProactiveChipLabels } from "@/lib/search/proactive-suggestions-client";
import type { AutocompleteContext } from "@/types/search";

export function useProactiveChipSuggestions(context: AutocompleteContext) {
  const [suggestions, setSuggestions] = useState<readonly string[]>(
    HERO_SUGGESTED_SEARCHES_FALLBACK,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    void (async () => {
      try {
        const labels = await fetchProactiveChipLabels(context, 5);
        if (!controller.signal.aborted && labels.length > 0) {
          setSuggestions(labels);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions(HERO_SUGGESTED_SEARCHES_FALLBACK);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [context]);

  return { suggestions, loading };
}
