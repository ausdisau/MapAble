"use client";

import {
  Crosshair,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type FloorPlanToolbarProps = {
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onReset: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  onToggleSimplify?: () => void;
  simplifyMode?: boolean;
  viewMode: "plan" | "text";
  onViewModeChange: (mode: "plan" | "text") => void;
  showKeyboardHelp: boolean;
  onToggleKeyboardHelp: () => void;
};

function ToolButton({
  label,
  onClick,
  children,
  pressed,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      className={`fp-tool-btn flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#005B7F] shadow-sm hover:bg-[#F6FBFC] ${pressed ? "ring-2 ring-[#005B7F]" : ""} ${mapableCareFocusRing}`}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function FloorPlanToolbar({
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onFit,
  onReset,
  onToggleFullscreen,
  isFullscreen,
  onToggleSimplify,
  simplifyMode,
  viewMode,
  onViewModeChange,
  showKeyboardHelp,
  onToggleKeyboardHelp,
}: FloorPlanToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Floor plan controls">
      <div className="flex flex-wrap gap-2">
        <ToolButton label="Zoom in" onClick={onZoomIn}>
          <ZoomIn className="h-5 w-5" aria-hidden="true" />
        </ToolButton>
        <ToolButton label="Zoom out" onClick={onZoomOut}>
          <ZoomOut className="h-5 w-5" aria-hidden="true" />
        </ToolButton>
        <ToolButton label="Fit to screen" onClick={onFit}>
          <Crosshair className="h-5 w-5" aria-hidden="true" />
        </ToolButton>
        <ToolButton label="Reset view" onClick={onReset}>
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
        </ToolButton>
        {onToggleFullscreen ? (
          <ToolButton
            label={isFullscreen ? "Exit full screen" : "Full screen"}
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Maximize2 className="h-5 w-5" aria-hidden="true" />
            )}
          </ToolButton>
        ) : null}
      </div>

      <span className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold" aria-live="polite">
        {zoomPercent}%
      </span>

      <div className="inline-flex rounded-xl border border-slate-300 p-1" role="group" aria-label="View mode">
        <button
          type="button"
          className={`min-h-11 rounded-lg px-3 text-sm font-bold ${viewMode === "plan" ? "bg-[#005B7F] text-white" : ""}`}
          aria-pressed={viewMode === "plan"}
          onClick={() => onViewModeChange("plan")}
        >
          Plan view
        </button>
        <button
          type="button"
          className={`min-h-11 rounded-lg px-3 text-sm font-bold ${viewMode === "text" ? "bg-[#005B7F] text-white" : ""}`}
          aria-pressed={viewMode === "text"}
          onClick={() => onViewModeChange("text")}
        >
          Text view
        </button>
      </div>

      {onToggleSimplify ? (
        <button
          type="button"
          className={`min-h-11 rounded-xl px-3 text-sm font-bold ${simplifyMode ? "bg-[#005B7F] text-white" : "border border-slate-300"}`}
          aria-pressed={simplifyMode}
          onClick={onToggleSimplify}
        >
          Simplify plan
        </button>
      ) : null}

      <button
        type="button"
        className={`min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-bold ${mapableCareFocusRing}`}
        aria-expanded={showKeyboardHelp}
        onClick={onToggleKeyboardHelp}
      >
        Keyboard help
      </button>
    </div>
  );
}

export function FloorPlanKeyboardHelp({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      id="fp-keyboard-help"
      className="rounded-xl border border-slate-200 bg-[#F6FBFC] p-4 text-sm text-slate-700"
    >
      <p className="font-bold">Keyboard controls (when floor plan is focused)</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Plus (+) — zoom in</li>
        <li>Minus (-) — zoom out</li>
        <li>Zero (0) — fit to screen</li>
        <li>Arrow keys — pan</li>
        <li>Escape — return focus to controls</li>
        <li>Tab — move between controls without trapping focus</li>
      </ul>
    </div>
  );
}
