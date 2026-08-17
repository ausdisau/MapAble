"use client";

import { useEffect, useRef, useState } from "react";

import { FloorPlanFeatureLayer } from "@/components/accessibility-map/floor-plan/FloorPlanFeatureLayer";
import { FloorPlanRouteLayer } from "@/components/accessibility-map/floor-plan/FloorPlanRouteLayer";
import { useFloorPlanPanZoom } from "@/hooks/useFloorPlanPanZoom";
import type { FloorPlanDetail, FloorPlanFeature } from "@/lib/access/floor-plan/schemas";

type FloorPlanCanvasProps = {
  plan: FloorPlanDetail;
  visibleFeatures: FloorPlanFeature[];
  selectedFeatureId?: string;
  activeRouteId?: string;
  onSelectFeature: (featureId: string) => void;
  onImageError: () => void;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onKeyboardPan: (dx: number, dy: number) => void;
  panZoom: ReturnType<typeof useFloorPlanPanZoom>;
};

export function FloorPlanCanvas({
  plan,
  visibleFeatures,
  selectedFeatureId,
  activeRouteId,
  onSelectFeature,
  onImageError,
  isFocused,
  onFocus,
  onBlur,
  panZoom,
}: FloorPlanCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    panZoom.resetView();
    setImageLoaded(false);
  }, [plan.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className="fp-canvas-container relative min-h-[420px] flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 md:min-h-[50vh]"
      tabIndex={0}
      role="grid"
      aria-label={`Interactive ${plan.floorName} floor plan. Use zoom controls and arrow keys when focused.`}
      aria-describedby="fp-keyboard-help"
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if (!isFocused) return;
        const step = 40;
        switch (e.key) {
          case "ArrowUp":
            e.preventDefault();
            panZoom.panBy(0, step);
            break;
          case "ArrowDown":
            e.preventDefault();
            panZoom.panBy(0, -step);
            break;
          case "ArrowLeft":
            e.preventDefault();
            panZoom.panBy(step, 0);
            break;
          case "ArrowRight":
            e.preventDefault();
            panZoom.panBy(-step, 0);
            break;
          case "+":
          case "=":
            e.preventDefault();
            panZoom.zoomIn();
            break;
          case "-":
            e.preventDefault();
            panZoom.zoomOut();
            break;
          case "0":
            e.preventDefault();
            panZoom.fitToScreen();
            break;
          default:
            break;
        }
      }}
      onPointerDown={panZoom.handlePointerDown}
      onPointerMove={panZoom.handlePointerMove}
      onPointerUp={panZoom.handlePointerUp}
      onPointerLeave={panZoom.handlePointerUp}
    >
      <div
        className="fp-canvas-transform relative mx-auto h-full w-full"
        style={panZoom.transformStyle}
      >
        <div className="relative aspect-[4/3] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- floor plan asset rendered as trusted image, not inline SVG */}
          <img
            src={plan.planAsset.url}
            alt={plan.planAsset.altText}
            width={plan.planAsset.width}
            height={plan.planAsset.height}
            className="block h-full w-full object-contain"
            onLoad={() => setImageLoaded(true)}
            onError={onImageError}
            draggable={false}
          />
          {imageLoaded ? (
            <>
              <FloorPlanRouteLayer
                zones={plan.zones}
                routes={plan.routes}
                activeRouteId={activeRouteId}
                floorPlanId={plan.id}
              />
              <FloorPlanFeatureLayer
                features={visibleFeatures}
                selectedFeatureId={selectedFeatureId}
                onSelectFeature={onSelectFeature}
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
