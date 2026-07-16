"use client";

import { buildFeatureAccessibleName, getFeatureConfig } from "@/lib/floor-plan/feature-config";
import { normalizedToPercent } from "@/lib/floor-plan/coordinates";
import type { FloorPlanFeature } from "@/lib/floor-plan/schemas";
import { operationalStatusLabel } from "@/lib/floor-plan/accessibility-utils";

type FloorPlanFeatureLayerProps = {
  features: FloorPlanFeature[];
  selectedFeatureId?: string;
  onSelectFeature: (featureId: string) => void;
};

export function FloorPlanFeatureLayer({
  features,
  selectedFeatureId,
  onSelectFeature,
}: FloorPlanFeatureLayerProps) {
  return (
    <>
      {features.map((feature) => {
        const config = getFeatureConfig(feature.type);
        const pos = normalizedToPercent(feature.position);
        const isSelected = selectedFeatureId === feature.id;
        const isUnavailable =
          feature.operationalStatus === "unavailable" ||
          feature.operationalStatus === "temporarily_closed";

        return (
          <button
            key={feature.id}
            type="button"
            className={`fp-marker fp-marker-btn ${config.markerClass} ${isSelected ? "fp-marker--selected" : ""} ${isUnavailable ? "fp-marker--unavailable" : ""}`}
            style={{
              left: pos.left,
              top: pos.top,
              position: "absolute",
              transform: "translate(-50%, -50%)",
            }}
            aria-label={buildFeatureAccessibleName(feature)}
            aria-pressed={isSelected}
            onClick={() => onSelectFeature(feature.id)}
          >
            <span className="fp-marker__icon" aria-hidden="true">
              {config.icon}
            </span>
            <span className="fp-marker__label" aria-hidden="true">
              {feature.shortLabel ?? config.shortLabel}
            </span>
            {isUnavailable ? (
              <span className="fp-marker__status" aria-hidden="true">
                {feature.operationalStatus === "temporarily_closed" ? "Closed" : "N/A"}
              </span>
            ) : null}
          </button>
        );
      })}
    </>
  );
}
