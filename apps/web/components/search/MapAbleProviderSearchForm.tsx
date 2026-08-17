"use client";

import { Loader2, MapPin, Search } from "lucide-react";
import React, { useState } from "react";

import { cn } from "@/app/lib/utils";
import { AccessibleAutocomplete } from "@/components/search/AccessibleAutocomplete";
import { SearchTrustRow } from "@/components/search/SearchTrustRow";
import { Button } from "@/components/ui/button";
import { mapableSearchFieldSecondaryClass } from "@/lib/brand/styles";
import type {
  AutocompleteContext,
  AutocompleteSuggestion,
  SuggestionSignals,
} from "@/types/search";

function preferredStateFromLocation(location: string): string | undefined {
  const match = location.match(/\b(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)\b/i);
  return match?.[1]?.toUpperCase();
}

export type MapAbleProviderSearchFormValues = {
  query: string;
  location: string;
  accessQuery: string;
  serviceQuery: string;
  providerName: string;
};

type MapAbleProviderSearchFormProps = {
  context: AutocompleteContext;
  values: MapAbleProviderSearchFormValues;
  onQueryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onAccessQueryChange: (value: string) => void;
  onServiceQueryChange: (value: string) => void;
  onProviderNameChange: (value: string) => void;
  onSubmit: () => void;
  onAccessSuggestionSelect?: (label: string) => void;
  isSubmitting?: boolean;
  showOptionalFields?: boolean;
  formId?: string;
  className?: string;
};

export function MapAbleProviderSearchForm({
  context,
  values,
  onQueryChange,
  onLocationChange,
  onAccessQueryChange,
  onServiceQueryChange,
  onProviderNameChange,
  onSubmit,
  onAccessSuggestionSelect,
  isSubmitting = false,
  showOptionalFields = true,
  formId = "mapable-provider-search",
  className,
}: MapAbleProviderSearchFormProps) {
  const [statusMessage, setStatusMessage] = useState("");

  const idPrefix = context === "homepage" ? "home" : "pf";

  const rankingSignals: SuggestionSignals | undefined = values.location.trim()
    ? { preferredState: preferredStateFromLocation(values.location) }
    : undefined;

  function mergeQueryFromSuggestion(suggestion: AutocompleteSuggestion) {
    if (suggestion.type === "provider") {
      onProviderNameChange(suggestion.value);
      onQueryChange(suggestion.value);
      return;
    }
    if (suggestion.type === "service" || suggestion.type === "popular_search") {
      onServiceQueryChange(suggestion.value);
      onQueryChange(suggestion.value);
      return;
    }
    if (suggestion.type === "location") {
      onLocationChange(suggestion.value);
      return;
    }
    if (suggestion.type === "accessibility_feature") {
      onAccessQueryChange(suggestion.value);
      onAccessSuggestionSelect?.(suggestion.value);
      return;
    }
    onQueryChange(suggestion.value);
  }

  return (
    <form
      id={formId}
      className={cn("text-left", className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setStatusMessage("Searching for matching providers.");
        onSubmit();
      }}
    >
      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-lg shadow-primary/5 sm:p-5">
        <AccessibleAutocomplete
          id={`${idPrefix}-search-primary`}
          label="Search for support"
          placeholder='Try "support worker", "wheelchair transport" or "OT"'
          context={context}
          field="all"
          value={values.query}
          onChange={onQueryChange}
          onSelect={mergeQueryFromSuggestion}
          signals={rankingSignals}
          disabled={isSubmitting}
          icon={<Search className="h-4 w-4" aria-hidden />}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <AccessibleAutocomplete
            id={`${idPrefix}-location`}
            label="Location"
            placeholder="Suburb or postcode"
            context={context}
            field="location"
            value={values.location}
            onChange={onLocationChange}
            onSelect={(s) => onLocationChange(s.value)}
            disabled={isSubmitting}
            icon={<MapPin className="h-4 w-4" aria-hidden />}
            helperText="Uses MapAble’s local location list — not a public geocoding API."
          />
          <AccessibleAutocomplete
            id={`${idPrefix}-access`}
            label="Access needs"
            placeholder="Wheelchair access, Auslan, low sensory..."
            context={context}
            field="accessibility"
            value={values.accessQuery}
            onChange={onAccessQueryChange}
            onSelect={(s) => {
              onAccessQueryChange(s.value);
              onAccessSuggestionSelect?.(s.value);
            }}
            disabled={isSubmitting}
          />
        </div>

        {showOptionalFields ? (
          <div
            className={cn("grid gap-3 sm:grid-cols-2", mapableSearchFieldSecondaryClass)}
          >
            <AccessibleAutocomplete
              id={`${idPrefix}-service`}
              label="Service type (optional)"
              placeholder="e.g. physiotherapy"
              context={context}
              field="service"
              value={values.serviceQuery}
              onChange={onServiceQueryChange}
              onSelect={(s) => {
                onServiceQueryChange(s.value);
                onQueryChange(s.value);
              }}
              disabled={isSubmitting}
            />
            <AccessibleAutocomplete
              id={`${idPrefix}-provider`}
              label="Provider name (optional)"
              placeholder="Provider or organisation"
              context={context}
              field="provider"
              value={values.providerName}
              onChange={onProviderNameChange}
              onSelect={(s) => {
                onProviderNameChange(s.value);
                onQueryChange(s.value);
              }}
              disabled={isSubmitting}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {statusMessage}
          </p>
          <Button
            type="submit"
            variant="default"
            size="lg"
            className="min-h-11 w-full sm:min-h-12 sm:w-auto sm:px-10"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Finding providers…
              </>
            ) : (
              "Find matching providers"
            )}
          </Button>
        </div>

        <SearchTrustRow />
      </div>
    </form>
  );
}
