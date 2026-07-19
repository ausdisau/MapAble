"use client";

import type { FeatureCategory } from "@/lib/floor-plan/feature-config";
import { FEATURE_CATEGORIES } from "@/lib/floor-plan/feature-config";

type FloorPlanFeatureFiltersProps = {
  activeCategories: Set<FeatureCategory>;
  onToggleCategory: (category: FeatureCategory) => void;
  onShowAll: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
};

export function FloorPlanFeatureFilters({
  activeCategories,
  onToggleCategory,
  onShowAll,
  searchQuery,
  onSearchChange,
}: FloorPlanFeatureFiltersProps) {
  const allActive = activeCategories.size === 0;

  return (
    <div className="space-y-3" role="group" aria-label="Feature filters">
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Search features
        </span>
        <input
          type="search"
          className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Toilet, lift, entrance…"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`min-h-11 rounded-xl px-3 text-xs font-bold ${allActive ? "bg-[#005B7F] text-white" : "border border-slate-300"}`}
          aria-pressed={allActive}
          onClick={onShowAll}
        >
          Show all features
        </button>
        {(Object.entries(FEATURE_CATEGORIES) as [FeatureCategory, string][]).map(
          ([key, label]) => {
            const active = activeCategories.has(key);
            return (
              <button
                key={key}
                type="button"
                className={`min-h-11 rounded-xl px-3 text-xs font-bold ${active ? "bg-[#005B7F] text-white" : "border border-slate-300"}`}
                aria-pressed={active}
                onClick={() => onToggleCategory(key)}
              >
                {label}
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}
