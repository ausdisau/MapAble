"use client";

import React from "react";

import { cn } from "@/app/lib/utils";
import { MapAbleProviderSearchForm } from "@/components/search/MapAbleProviderSearchForm";
import { SuggestedSearchChips } from "@/components/search/SuggestedSearchChips";
import { Badge } from "@/components/ui/badge";
import { mapableEyebrowBadgeClass } from "@/lib/brand/styles";
import { useProactiveChipSuggestions } from "@/lib/hooks/use-proactive-chip-suggestions";

type ProviderFinderHeroProps = {
  query: string;
  location: string;
  providerName: string;
  serviceQuery: string;
  accessQuery: string;
  onQueryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onProviderNameChange: (value: string) => void;
  onServiceQueryChange: (value: string) => void;
  onAccessQueryChange: (value: string) => void;
  onSearch: () => void;
  onSuggestionClick: (suggestion: string) => void;
  onAccessSuggestionSelect?: (label: string) => void;
  isSubmitting?: boolean;
  compact?: boolean;
};

export function ProviderFinderHero({
  query,
  location,
  providerName,
  serviceQuery,
  accessQuery,
  onQueryChange,
  onLocationChange,
  onProviderNameChange,
  onServiceQueryChange,
  onAccessQueryChange,
  onSearch,
  onSuggestionClick,
  onAccessSuggestionSelect,
  isSubmitting = false,
  compact = false,
}: ProviderFinderHeroProps) {
  const { suggestions: chipSuggestions } =
    useProactiveChipSuggestions("provider_finder");

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-slate-200 bg-[#F6FBFC]",
        compact ? "py-8" : "py-12 sm:py-16 lg:py-20",
      )}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl motion-reduce:blur-none"
        aria-hidden
      />
      <div className="container relative mx-auto max-w-5xl px-4">
        <Badge variant="outline" className={cn("mb-4", mapableEyebrowBadgeClass)}>
          Provider Finder
        </Badge>
        <h1
          className={cn(
            "mapable-display font-black tracking-[-0.04em] text-[#0C1833]",
            compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl lg:text-5xl",
          )}
        >
          Find support that fits your life.
        </h1>
        <p
          className={cn(
            "mt-3 max-w-2xl text-slate-600",
            compact ? "text-sm" : "text-base sm:text-lg",
          )}
        >
          Find care, transport, therapy and home support that matches your access
          needs, location and funding.
        </p>

        <div className="mt-8">
          <MapAbleProviderSearchForm
            context="provider_finder"
            values={{ query, location, accessQuery, serviceQuery, providerName }}
            onQueryChange={onQueryChange}
            onLocationChange={onLocationChange}
            onAccessQueryChange={onAccessQueryChange}
            onServiceQueryChange={onServiceQueryChange}
            onProviderNameChange={onProviderNameChange}
            onSubmit={onSearch}
            onAccessSuggestionSelect={onAccessSuggestionSelect}
            isSubmitting={isSubmitting}
            formId="provider-finder-search"
          />
        </div>

        {!compact ? (
          <SuggestedSearchChips
            className="mt-6"
            suggestions={chipSuggestions}
            onSelect={onSuggestionClick}
          />
        ) : null}
      </div>
    </section>
  );
}
