"use client";

import { cn } from "@/app/lib/utils";
import {
  ACCESS_NEEDS,
  FUNDING_OPTIONS,
  SUPPORT_TYPES,
  type SupportTypeId,
} from "@/lib/provider-finder/filters";

type ProviderFinderSidebarProps = {
  supportType: SupportTypeId;
  onSupportTypeChange: (id: SupportTypeId) => void;
  accessNeeds: string[];
  onAccessNeedsChange: (ids: string[]) => void;
  funding: (typeof FUNDING_OPTIONS)[number]["id"];
  onFundingChange: (id: (typeof FUNDING_OPTIONS)[number]["id"]) => void;
};

export function ProviderFinderSidebar({
  supportType,
  onSupportTypeChange,
  accessNeeds,
  onAccessNeedsChange,
  funding,
  onFundingChange,
}: ProviderFinderSidebarProps) {
  function toggleAccessNeed(id: string) {
    onAccessNeedsChange(
      accessNeeds.includes(id)
        ? accessNeeds.filter((x) => x !== id)
        : [...accessNeeds, id],
    );
  }

  return (
    <aside
      className="space-y-8 rounded-xl border border-border/60 bg-card p-5 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
      aria-label="Refine search"
    >
      <div>
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Refine search
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Narrow results by support type, access needs and funding.
        </p>
      </div>

      <div>
        <h3 id="pf-support-type-heading" className="text-sm font-semibold text-foreground">
          Support type
        </h3>
        <ul
          className="mt-3 space-y-1"
          role="group"
          aria-labelledby="pf-support-type-heading"
          aria-controls="provider-finder-results"
        >
          {SUPPORT_TYPES.map((type) => (
            <li key={type.id}>
              <button
                type="button"
                onClick={() => onSupportTypeChange(type.id)}
                className={cn(
                  "w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
                  supportType === type.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
                aria-pressed={supportType === type.id}
                aria-controls="provider-finder-results"
              >
                {type.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 id="pf-access-needs-heading" className="text-sm font-semibold text-foreground">
          Access needs
        </h3>
        <div
          className="mt-3 flex flex-wrap gap-2"
          role="group"
          aria-labelledby="pf-access-needs-heading"
          aria-live="polite"
        >
          {ACCESS_NEEDS.map((need) => {
            const active = accessNeeds.includes(need.id);
            return (
              <button
                key={need.id}
                type="button"
                onClick={() => toggleAccessNeed(need.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-accent",
                )}
                aria-pressed={active}
                aria-controls="provider-finder-results"
              >
                {need.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 id="pf-funding-heading" className="text-sm font-semibold text-foreground">
          Funding
        </h3>
        <div
          className="mt-3 space-y-1"
          role="group"
          aria-labelledby="pf-funding-heading"
        >
          {FUNDING_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onFundingChange(option.id)}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
                funding === option.id
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-accent",
              )}
              aria-pressed={funding === option.id}
              aria-controls="provider-finder-results"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
