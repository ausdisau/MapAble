"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/app/lib/utils";
import { mapableSearchInputClass } from "@/lib/brand/styles";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
  buildLiveRegionMessage,
  flattenSuggestions,
} from "@/lib/search/autocomplete-utils";
import {
  getStaticFallbackGroups,
  isSuggestionGroupsEmpty,
} from "@/lib/search/suggestion-fallback-catalog";
import type {
  AutocompleteContext,
  AutocompleteField,
  AutocompleteGroupedResult,
  AutocompleteSuggestion,
  SuggestionMode,
  SuggestionResultMeta,
  SuggestionSignals,
} from "@/types/search";

export type AccessibleAutocompleteProps = {
  id?: string;
  label: string;
  placeholder?: string;
  context: AutocompleteContext;
  field?: AutocompleteField;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AutocompleteSuggestion) => void;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  icon?: React.ReactNode;
  /** @default 300 — use 0 in tests */
  debounceMs?: number;
  /** Rules-based ranking hints (recent searches, preferred state). */
  signals?: SuggestionSignals;
};

export function AccessibleAutocomplete({
  id: idProp,
  label,
  placeholder,
  context,
  field = "all",
  value,
  onChange,
  onSelect,
  helperText,
  disabled = false,
  required = false,
  className,
  inputClassName,
  icon,
  debounceMs = 300,
  signals,
}: AccessibleAutocompleteProps) {
  const autoId = useId();
  const inputId = idProp ?? `ac-${autoId}`;
  const listboxId = `${inputId}-listbox`;
  const liveId = `${inputId}-live`;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<AutocompleteGroupedResult | null>(null);
  const [meta, setMeta] = useState<SuggestionResultMeta | null>(null);
  const [fetchMode, setFetchMode] = useState<SuggestionMode>("reactive");
  const [activeIndex, setActiveIndex] = useState(-1);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebouncedValue(value, debounceMs);
  const suggestions = groups ? flattenSuggestions(groups) : [];
  const queryForList = debouncedQuery.trim().length >= 2 ? debouncedQuery : value;
  const liveMessage = buildLiveRegionMessage(
    loading,
    suggestions.length,
    queryForList,
    fetchMode,
  );

  const fetchSuggestions = useCallback(
    async (mode: SuggestionMode) => {
      const q = debouncedQuery.trim();
      const useProactive = mode === "proactive";

      if (!useProactive && q.length < 2) {
        fetchAbortRef.current?.abort();
        setGroups(null);
        setMeta(null);
        setActiveIndex(-1);
        setLoading(false);
        return;
      }

      fetchAbortRef.current?.abort();
      const controller = new AbortController();
      fetchAbortRef.current = controller;

      setLoading(true);
      setFetchMode(mode);
      try {
        const params = new URLSearchParams({
          context,
          field,
          mode,
        });
        if (useProactive) {
          params.set("q", q);
        } else {
          params.set("q", q);
        }
        if (signals) {
          params.set("signals", JSON.stringify(signals));
        }
        const res = await fetch(`/api/search/autocomplete?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          if (!controller.signal.aborted) {
            setGroups(null);
            setMeta(null);
          }
          return;
        }
        const data = (await res.json()) as {
          groups: AutocompleteGroupedResult;
          meta?: SuggestionResultMeta;
        };
        if (controller.signal.aborted) return;
        let groups = data.groups;
        let meta = data.meta ?? null;
        if (isSuggestionGroupsEmpty(groups)) {
          groups = getStaticFallbackGroups(mode, q, field);
          meta = {
            mode,
            degraded: true,
            degradedReason: "static_fallback_client",
            sourceCounts: {
              providers: groups.providers.length,
              services: groups.services.length,
              locations: groups.locations.length,
              accessibilityFeatures: groups.accessibilityFeatures.length,
              languages: groups.languages.length,
              popularSearches: groups.popularSearches.length,
            },
          };
        }
        setGroups(groups);
        setMeta(meta);
        setActiveIndex(-1);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setGroups(null);
          setMeta(null);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [context, debouncedQuery, field, signals],
  );

  useEffect(() => {
    const q = debouncedQuery.trim();
    const mode: SuggestionMode = q.length >= 2 ? "reactive" : "proactive";
    void fetchSuggestions(mode);
    return () => fetchAbortRef.current?.abort();
  }, [fetchSuggestions, debouncedQuery]);

  function selectSuggestion(suggestion: AutocompleteSuggestion) {
    onChange(suggestion.value);
    onSelect?.(suggestion);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
    // Tab moves focus naturally — do not trap
  }

  const showList =
    open &&
    !disabled &&
    (suggestions.length > 0 ||
      loading ||
      value.trim().length >= 2 ||
      debouncedQuery.trim().length >= 2);

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>

      <div className="relative mt-1.5">
        {icon ? (
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          aria-activedescendant={
            showList && activeIndex >= 0
              ? `${inputId}-option-${activeIndex}`
              : undefined
          }
          aria-autocomplete="list"
          aria-describedby={
            [helperId, liveId].filter(Boolean).join(" ") || undefined
          }
          autoComplete="off"
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (blurTimeout.current) clearTimeout(blurTimeout.current);
            setOpen(true);
            if (value.trim().length < 2) {
              void fetchSuggestions("proactive");
            }
          }}
          onBlur={() => {
            blurTimeout.current = setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            mapableSearchInputClass,
            icon ? "pl-10" : "pl-3",
            inputClassName,
          )}
        />
      </div>

      {helperText ? (
        <p id={helperId} className="mt-1.5 text-xs text-muted-foreground">
          {helperText}
        </p>
      ) : null}
      {meta?.degraded ? (
        <p className="mt-1 text-xs text-muted-foreground" role="status">
          Some suggestion sources are temporarily limited. Results may be incomplete.
        </p>
      ) : null}

      <p id={liveId} className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </p>

      {showList ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-lg"
        >
          {loading ? (
            <li
              className="px-3 py-2.5 text-sm text-muted-foreground"
              role="presentation"
            >
              Loading suggestions…
            </li>
          ) : null}
          {suggestions.length === 0 && !loading ? (
            <li
              className="px-3 py-2.5 text-sm text-muted-foreground"
              role="presentation"
            >
              No matches. Try different words.
            </li>
          ) : null}
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              id={`${inputId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-2.5 text-sm outline-none",
                index === activeIndex
                  ? "bg-accent text-accent-foreground ring-2 ring-ring"
                  : "hover:bg-muted",
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectSuggestion(suggestion)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  selectSuggestion(suggestion);
                }
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{suggestion.label}</span>
                <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
                  {suggestion.typeLabel}
                </span>
              </div>
              {suggestion.description ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {suggestion.description}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
