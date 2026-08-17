"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

import { cn } from "@/app/lib/utils";
import { MapAbleProviderSearchForm } from "@/components/search/MapAbleProviderSearchForm";
import { SuggestedSearchChips } from "@/components/search/SuggestedSearchChips";
import { Badge } from "@/components/ui/badge";
import { trackProductEvent } from "@/lib/analytics/product-analytics";
import { mapableEyebrowBadgeClass } from "@/lib/brand/styles";
import { useProactiveChipSuggestions } from "@/lib/hooks/use-proactive-chip-suggestions";
import { ACCESS_NEEDS } from "@/lib/provider/finder/filters";
import {
  applyInterpretationToFields,
  buildFinderSearchParams,
} from "@/lib/search/apply-interpretation";
import { interpretSearchQueryClient } from "@/lib/search/interpreter-client";

export function HomeSearch() {
  const router = useRouter();
  const { suggestions: chipSuggestions } = useProactiveChipSuggestions("homepage");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [accessQuery, setAccessQuery] = useState("");
  const [serviceQuery, setServiceQuery] = useState("");
  const [providerName, setProviderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function navigateToFinder() {
    setIsSubmitting(true);
    try {
      const combined =
        query.trim() ||
        [serviceQuery, accessQuery, location, providerName]
          .filter(Boolean)
          .join(" ");

      if (combined.trim().length >= 3) {
        const interpretation = await interpretSearchQueryClient(
          combined,
          "homepage",
        );
        const applied = applyInterpretationToFields(interpretation, {
          query,
          location,
          providerName,
          serviceQuery,
          accessQuery,
        });

        trackProductEvent("search_query_interpreted", {
          context: "homepage",
          parsed: interpretation.parsed,
          confidence: interpretation.confidence,
          service_category_slug: interpretation.serviceCategorySlug ?? "",
          engine_id: interpretation.engineId,
        });

        const params = buildFinderSearchParams(applied);
        const qs = params.toString();
        router.push(qs ? `/provider-finder?${qs}` : "/provider-finder");
        return;
      }
    } finally {
      setIsSubmitting(false);
    }

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("location", location.trim());
    if (accessQuery.trim()) params.set("access", accessQuery.trim());
    if (serviceQuery.trim()) params.set("service", serviceQuery.trim());
    if (providerName.trim()) params.set("provider", providerName.trim());
    const qs = params.toString();
    router.push(qs ? `/provider-finder?${qs}` : "/provider-finder");
  }

  function handleAccessSuggestion(label: string) {
    const match = ACCESS_NEEDS.find(
      (n) =>
        n.label.toLowerCase() === label.toLowerCase() ||
        n.keywords.some((kw) => label.toLowerCase().includes(kw)),
    );
    if (match) {
      setAccessQuery(match.label);
    }
  }

  function applyChip(suggestion: string) {
    setQuery(suggestion);
  }

  return (
    <section
      aria-labelledby="home-hero-heading"
      className="border-b border-border/60 bg-gradient-to-b from-primary/[0.08] via-background to-background py-12 sm:py-16 lg:py-20"
    >
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
          <Badge
            variant="outline"
            className={cn("mb-4", mapableEyebrowBadgeClass)}
          >
            Provider Finder
          </Badge>
          <h1
            id="home-hero-heading"
            className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            Find support that fits your life.
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Find care, transport, therapy and home support that matches your
            access needs, location and funding.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-3xl lg:mx-0 lg:max-w-none">
          <MapAbleProviderSearchForm
            context="homepage"
            values={{ query, location, accessQuery, serviceQuery, providerName }}
            onQueryChange={setQuery}
            onLocationChange={setLocation}
            onAccessQueryChange={setAccessQuery}
            onServiceQueryChange={setServiceQuery}
            onProviderNameChange={setProviderName}
            onSubmit={() => {
              void navigateToFinder();
            }}
            onAccessSuggestionSelect={handleAccessSuggestion}
            isSubmitting={isSubmitting}
            formId="home-provider-search"
          />
        </div>

        <SuggestedSearchChips
          className="mx-auto mt-6 max-w-3xl lg:mx-0 lg:max-w-none"
          suggestions={chipSuggestions}
          onSelect={applyChip}
        />
      </div>
    </section>
  );
}
