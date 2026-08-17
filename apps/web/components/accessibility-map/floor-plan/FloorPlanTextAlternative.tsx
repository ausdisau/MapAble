"use client";

import {
  formatFeatureMeasurements,
  operationalStatusLabel,
  statusTrustLabel,
} from "@/lib/access/floor-plan/accessibility-utils";
import { getFeatureConfig, type FeatureCategory } from "@/lib/access/floor-plan/feature-config";
import type { FloorPlanFeature, FloorPlanRoute } from "@/lib/access/floor-plan/schemas";

type FloorPlanTextAlternativeProps = {
  features: FloorPlanFeature[];
  routes: FloorPlanRoute[];
  floorName: string;
  selectedFeatureId?: string;
  onSelectFeature: (featureId: string) => void;
  onSelectRoute?: (routeId: string) => void;
};

function groupFeaturesByCategory(features: FloorPlanFeature[]) {
  const groups = new Map<string, FloorPlanFeature[]>();
  for (const feature of features) {
    const cat = getFeatureConfig(feature.type).categoryLabel;
    const list = groups.get(cat) ?? [];
    list.push(feature);
    groups.set(cat, list);
  }
  return groups;
}

export function FloorPlanTextAlternative({
  features,
  routes,
  floorName,
  selectedFeatureId,
  onSelectFeature,
  onSelectRoute,
}: FloorPlanTextAlternativeProps) {
  const groups = groupFeaturesByCategory(features);

  return (
    <div className="space-y-6" aria-label={`Text alternative for ${floorName}`}>
      <h3 className="text-lg font-black">Floor plan as a list — {floorName}</h3>

      {features.length === 0 ? (
        <p className="text-sm text-slate-600">
          The floor plan image is available, but detailed accessibility markers have not yet been
          added. Venue-level accessibility information remains available in the place profile.
        </p>
      ) : (
        Array.from(groups.entries()).map(([category, items]) => (
          <section key={category} aria-labelledby={`text-cat-${category}`}>
            <h4 id={`text-cat-${category}`} className="font-bold text-[#005B7F]">
              {category}
            </h4>
            <ul className="mt-2 space-y-2">
              {items.map((feature) => {
                const config = getFeatureConfig(feature.type);
                const measurements = formatFeatureMeasurements(feature);
                const isSelected = selectedFeatureId === feature.id;
                return (
                  <li
                    key={feature.id}
                    className={`rounded-xl border p-3 ${isSelected ? "border-[#005B7F] bg-[#F6FBFC]" : "border-slate-200"}`}
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => onSelectFeature(feature.id)}
                      aria-current={isSelected ? "true" : undefined}
                    >
                      <span className="font-semibold">
                        {config.icon} {feature.name}
                      </span>
                      <span className="mt-1 block text-xs text-slate-600">
                        {statusTrustLabel(feature.status)}
                        {feature.operationalStatus
                          ? ` · ${operationalStatusLabel(feature.operationalStatus)}`
                          : ""}
                      </span>
                      {measurements.length > 0 ? (
                        <ul className="mt-1 text-xs text-slate-600">
                          {measurements.map((m) => (
                            <li key={m}>{m}</li>
                          ))}
                        </ul>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      {routes.length > 0 ? (
        <section aria-labelledby="text-routes-heading">
          <h4 id="text-routes-heading" className="font-bold text-[#005B7F]">
            Verified routes
          </h4>
          <ul className="mt-2 space-y-3">
            {routes.map((route) => (
              <li key={route.id} className="rounded-xl border border-slate-200 p-3">
                <button
                  type="button"
                  className="w-full text-left font-semibold"
                  onClick={() => onSelectRoute?.(route.id)}
                >
                  {route.name}
                </button>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
                  {route.steps.map((step) => (
                    <li key={step.id}>{step.instruction}</li>
                  ))}
                </ol>
                {route.warnings?.map((w) => (
                  <p key={w} className="mt-1 text-xs text-amber-900">
                    ⚠ {w}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export function filterFeaturesForDisplay(
  features: FloorPlanFeature[],
  activeCategories: Set<FeatureCategory>,
  searchQuery: string,
  selectedFeatureId?: string,
  simplifyMode?: boolean,
): FloorPlanFeature[] {
  const q = searchQuery.trim().toLowerCase();
  return features.filter((feature) => {
    if (selectedFeatureId === feature.id) return true;
    const config = getFeatureConfig(feature.type);
    if (simplifyMode && !config.simplifyVisible) return false;
    if (activeCategories.size > 0 && !activeCategories.has(config.category)) return false;
    if (q) {
      const haystack = `${feature.name} ${config.label} ${feature.description ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
