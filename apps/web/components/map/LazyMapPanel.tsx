"use client";

import { List, Map as MapIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/app/lib/utils";

export type DirectoryViewMode = "list" | "map";

type LazyMapPanelProps = {
  view: DirectoryViewMode;
  onViewChange: (view: DirectoryViewMode) => void;
  /** Always rendered — SSR/list HTML that must not wait on map scripts. */
  list: ReactNode;
  /** Only mounted when `view === "map"` so MapLibre/Leaflet stay out of the critical path. */
  map: ReactNode;
  resultsPanelId?: string;
  className?: string;
  listLabel?: string;
  mapLabel?: string;
  statusMessage?: string;
};

/**
 * List-first directory shell: list HTML is always present; map chunk loads on demand.
 */
export function LazyMapPanel({
  view,
  onViewChange,
  list,
  map,
  resultsPanelId = "directory-results-panel",
  className,
  listLabel = "List view",
  mapLabel = "Map view",
  statusMessage,
}: LazyMapPanelProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Directory display mode"
          className="inline-flex rounded-xl border border-border/70 bg-background p-1"
        >
          <button
            type="button"
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted/60",
            )}
            aria-pressed={view === "list"}
            aria-controls={resultsPanelId}
            aria-label={listLabel}
            onClick={() => onViewChange("list")}
          >
            <List className="h-4 w-4" aria-hidden />
            List
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              view === "map"
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted/60",
            )}
            aria-pressed={view === "map"}
            aria-controls={resultsPanelId}
            aria-label={mapLabel}
            onClick={() => onViewChange("map")}
          >
            <MapIcon className="h-4 w-4" aria-hidden />
            Map
          </button>
        </div>
        {statusMessage ? (
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            {statusMessage}
          </p>
        ) : null}
      </div>

      <div id={resultsPanelId} className="space-y-4">
        {view === "map" ? (
          <section
            className="min-h-[400px] overflow-hidden rounded-xl border border-border/60 shadow-sm"
            aria-label="Interactive map"
          >
            {map}
          </section>
        ) : null}

        {/* List HTML is always present so crawlers and users never wait on map scripts. */}
        <section aria-label="Directory list">{list}</section>
      </div>

      <noscript>
        <p className="text-sm text-muted-foreground">
          Directory list results work without JavaScript. The interactive map is an optional
          enhancement.
        </p>
      </noscript>
    </div>
  );
}
