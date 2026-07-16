"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FloorPlanCanvas } from "@/components/accessibility-map/floor-plan/FloorPlanCanvas";
import { FloorPlanEmptyState } from "@/components/accessibility-map/floor-plan/FloorPlanEmptyState";
import { FloorPlanErrorState } from "@/components/accessibility-map/floor-plan/FloorPlanErrorState";
import { FloorPlanFeatureDetails } from "@/components/accessibility-map/floor-plan/FloorPlanFeatureDetails";
import { FloorPlanFeatureFilters } from "@/components/accessibility-map/floor-plan/FloorPlanFeatureFilters";
import { FloorPlanLegend } from "@/components/accessibility-map/floor-plan/FloorPlanLegend";
import { FloorPlanLoadingState } from "@/components/accessibility-map/floor-plan/FloorPlanLoadingState";
import { FloorPlanStatusNotice } from "@/components/accessibility-map/floor-plan/FloorPlanStatusNotice";
import {
  FloorPlanKeyboardHelp,
  FloorPlanToolbar,
} from "@/components/accessibility-map/floor-plan/FloorPlanToolbar";
import {
  filterFeaturesForDisplay,
  FloorPlanTextAlternative,
} from "@/components/accessibility-map/floor-plan/FloorPlanTextAlternative";
import { FloorSelector } from "@/components/accessibility-map/floor-plan/FloorSelector";
import { useFloorPlanPanZoom } from "@/hooks/useFloorPlanPanZoom";
import {
  useVenueFloorPlanDetail,
  useVenueFloorPlanSummaries,
} from "@/hooks/useVenueFloorPlans";
import type { FeatureCategory } from "@/lib/floor-plan/feature-config";
import { findConnector, isRouteAvailable } from "@/lib/floor-plan/route-utils";
import { sortFloors } from "@/lib/floor-plan/route-utils";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type FloorPlanViewerProps = {
  venueId: string;
  venueName: string;
  venueSlug?: string;
  initialFloorId?: string;
  initialFeatureId?: string;
  initialRouteId?: string;
  initialView?: "plan" | "text";
  onClose?: () => void;
  embedded?: boolean;
};

export function FloorPlanViewer({
  venueId,
  venueName,
  venueSlug,
  initialFloorId,
  initialFeatureId,
  initialRouteId,
  initialView = "plan",
  onClose,
  embedded = false,
}: FloorPlanViewerProps) {
  const summariesQuery = useVenueFloorPlanSummaries(venueId);
  const [activeFloorId, setActiveFloorId] = useState<string | undefined>(initialFloorId);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | undefined>(initialFeatureId);
  const [activeRouteId, setActiveRouteId] = useState<string | undefined>(initialRouteId);
  const [viewMode, setViewMode] = useState<"plan" | "text">(initialView);
  const [activeCategories, setActiveCategories] = useState<Set<FeatureCategory>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [simplifyMode, setSimplifyMode] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [canvasFocused, setCanvasFocused] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const liveRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panZoom = useFloorPlanPanZoom(containerRef);

  const floors = useMemo(
    () => sortFloors(summariesQuery.data?.plans ?? []),
    [summariesQuery.data?.plans],
  );

  useEffect(() => {
    if (!activeFloorId && floors.length > 0) {
      setActiveFloorId(initialFloorId ?? floors[0].id);
    }
  }, [floors, activeFloorId, initialFloorId]);

  const detailQuery = useVenueFloorPlanDetail(venueId, activeFloorId, Boolean(activeFloorId));

  const announce = useCallback((message: string) => {
    if (liveRef.current) liveRef.current.textContent = message;
  }, []);

  const handleSelectFloor = useCallback(
    (floorId: string) => {
      setActiveFloorId(floorId);
      setSelectedFeatureId(undefined);
      setActiveRouteId(undefined);
      setImageError(false);
      const floor = floors.find((f) => f.id === floorId);
      announce(`Showing ${floor?.floorName ?? "floor"}`);
    },
    [floors, announce],
  );

  const handleSelectFeature = useCallback(
    (featureId: string) => {
      setSelectedFeatureId(featureId);
      const feature = detailQuery.data?.plan.features.find((f) => f.id === featureId);
      if (feature) announce(`Selected ${feature.name}`);
    },
    [detailQuery.data?.plan.features, announce],
  );

  const handleViewConnectorFloor = useCallback(
    (floorPlanId: string, featureId?: string) => {
      setActiveFloorId(floorPlanId);
      if (featureId) setSelectedFeatureId(featureId);
      announce("Switched to connected floor");
    },
    [announce],
  );

  const toggleCategory = useCallback((category: FeatureCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const visibleFeatures = useMemo(() => {
    if (!detailQuery.data) return [];
    return filterFeaturesForDisplay(
      detailQuery.data.plan.features,
      activeCategories,
      searchQuery,
      selectedFeatureId,
      simplifyMode,
    );
  }, [detailQuery.data, activeCategories, searchQuery, selectedFeatureId, simplifyMode]);

  const selectedFeature = detailQuery.data?.plan.features.find(
    (f) => f.id === selectedFeatureId,
  );
  const selectedConnector = selectedFeature?.connectorId
    ? findConnector(detailQuery.data?.plan.connectors ?? [], selectedFeature.connectorId)
    : undefined;

  const availableRoutes = useMemo(() => {
    if (!detailQuery.data) return [];
    return detailQuery.data.plan.routes.filter((r) =>
      isRouteAvailable(r, detailQuery.data!.plan.features),
    );
  }, [detailQuery.data]);

  if (summariesQuery.isLoading) return <FloorPlanLoadingState />;
  if (summariesQuery.isError) {
    return (
      <FloorPlanErrorState
        message="Could not load floor plan information."
        onRetry={() => summariesQuery.refetch()}
        onClose={onClose}
      />
    );
  }
  if (!summariesQuery.data?.hasFloorPlan || floors.length === 0) {
    return <FloorPlanEmptyState onClose={onClose} />;
  }

  const plan = detailQuery.data?.plan;
  const reportHref = venueSlug
    ? `/add-access-info?place=${encodeURIComponent(venueName)}&floorPlan=${activeFloorId ?? ""}&feature=${selectedFeatureId ?? ""}`
    : `/add-access-info?place=${encodeURIComponent(venueName)}`;

  return (
    <div
      className={`fp-viewer flex flex-col gap-4 ${isFullscreen ? "fixed inset-0 z-[60] overflow-y-auto bg-white p-4" : ""} ${embedded ? "" : ""}`}
      role="region"
      aria-label={`Floor plan viewer for ${venueName}`}
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true" ref={liveRef} />

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-[#0C1833]">{venueName}</h2>
          <p className="text-sm text-slate-600">
            {plan?.floorName ?? "Loading floor…"}
            {summariesQuery.data.floorPlanLastVerifiedAt
              ? ` · Last verified ${new Date(summariesQuery.data.floorPlanLastVerifiedAt).toLocaleDateString()}`
              : ""}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Interactive floor plan. Use Text view for a complete textual alternative. Zoom and pan
            controls are available above the plan.
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            className={`min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
            onClick={onClose}
          >
            Close
          </button>
        ) : null}
      </header>

      <FloorSelector floors={floors} activeFloorId={activeFloorId ?? ""} onSelectFloor={handleSelectFloor} />

      <FloorPlanToolbar
        zoomPercent={panZoom.zoomPercent}
        onZoomIn={() => {
          panZoom.zoomIn();
          announce(`Zoom ${panZoom.zoomPercent + 25} percent`);
        }}
        onZoomOut={() => {
          panZoom.zoomOut();
          announce(`Zoom ${Math.max(50, panZoom.zoomPercent - 25)} percent`);
        }}
        onFit={panZoom.fitToScreen}
        onReset={panZoom.resetView}
        onToggleFullscreen={() => setIsFullscreen((v) => !v)}
        isFullscreen={isFullscreen}
        onToggleSimplify={() => setSimplifyMode((v) => !v)}
        simplifyMode={simplifyMode}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showKeyboardHelp={showKeyboardHelp}
        onToggleKeyboardHelp={() => setShowKeyboardHelp((v) => !v)}
      />

      <FloorPlanKeyboardHelp visible={showKeyboardHelp} />

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr_18rem]">
        <aside className="hidden space-y-4 lg:block">
          <FloorPlanFeatureFilters
            activeCategories={activeCategories}
            onToggleCategory={toggleCategory}
            onShowAll={() => setActiveCategories(new Set())}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <FloorPlanLegend />
        </aside>

        <div className="space-y-4">
          {detailQuery.isLoading ? <FloorPlanLoadingState /> : null}
          {detailQuery.isError ? (
            <FloorPlanErrorState
              message="Floor plan data could not be loaded."
              onRetry={() => detailQuery.refetch()}
            />
          ) : null}

          {viewMode === "text" && plan ? (
            <FloorPlanTextAlternative
              features={visibleFeatures}
              routes={availableRoutes}
              floorName={plan.floorName}
              selectedFeatureId={selectedFeatureId}
              onSelectFeature={(id) => {
                handleSelectFeature(id);
                setViewMode("plan");
              }}
              onSelectRoute={setActiveRouteId}
            />
          ) : null}

          {viewMode === "plan" && plan ? (
            <>
              {imageError ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950" role="alert">
                  The floor plan image could not be loaded. Feature information remains available in
                  Text view.
                </p>
              ) : null}
              <div ref={containerRef}>
                <FloorPlanCanvas
                  plan={plan}
                  visibleFeatures={visibleFeatures}
                  selectedFeatureId={selectedFeatureId}
                  activeRouteId={activeRouteId}
                  onSelectFeature={handleSelectFeature}
                  onImageError={() => setImageError(true)}
                  isFocused={canvasFocused}
                  onFocus={() => setCanvasFocused(true)}
                  onBlur={() => setCanvasFocused(false)}
                  onKeyboardPan={panZoom.panBy}
                  panZoom={panZoom}
                />
              </div>
              {plan.features.length === 0 ? (
                <p className="text-sm text-slate-600">
                  Detailed accessibility markers have not yet been added to this floor plan.
                </p>
              ) : null}
            </>
          ) : null}

          {/* Mobile filters */}
          <div className="lg:hidden">
            <FloorPlanFeatureFilters
              activeCategories={activeCategories}
              onToggleCategory={toggleCategory}
              onShowAll={() => setActiveCategories(new Set())}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </div>

        <aside className="space-y-4">
          {selectedFeature && plan ? (
            <FloorPlanFeatureDetails
              feature={selectedFeature}
              floorName={plan.floorName}
              connector={selectedConnector}
              onViewConnectorFloor={handleViewConnectorFloor}
              reportHref={reportHref}
              onClose={() => setSelectedFeatureId(undefined)}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
              Select a feature on the plan or in Text view to see details.
            </div>
          )}

          {availableRoutes.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-bold">Verified routes</h3>
              <ul className="mt-2 space-y-2">
                {availableRoutes.map((route) => (
                  <li key={route.id}>
                    <button
                      type="button"
                      className={`min-h-11 w-full rounded-xl px-3 text-left text-sm font-semibold ${activeRouteId === route.id ? "bg-[#005B7F] text-white" : "border border-slate-300"}`}
                      onClick={() => {
                        setActiveRouteId(route.id);
                        announce(`Showing route: ${route.name}`);
                      }}
                    >
                      {route.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              No verified indoor route is available for this floor.
            </p>
          )}

          {plan?.sourceName ? (
            <p className="text-xs text-slate-500">
              Source: {plan.sourceName}
              {plan.licenceOrPermission ? ` · ${plan.licenceOrPermission}` : ""}
            </p>
          ) : null}

          <FloorPlanStatusNotice />
        </aside>
      </div>
    </div>
  );
}
