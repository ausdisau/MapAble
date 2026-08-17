"use client";

import type { ReactNode } from "react";

export function MobileAccessMapShell({
  children,
  view,
  onViewChange,
}: {
  children: ReactNode;
  view: "list" | "map";
  onViewChange: (v: "list" | "map") => void;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="sticky top-0 z-10 flex gap-2 border-b border-border bg-background p-2 md:hidden">
        <button
          type="button"
          className={`min-h-11 flex-1 rounded-lg text-sm font-medium ${view === "list" ? "bg-primary text-primary-foreground" : "border border-border"}`}
          onClick={() => onViewChange("list")}
          aria-pressed={view === "list"}
        >
          List
        </button>
        <button
          type="button"
          className={`min-h-11 flex-1 rounded-lg text-sm font-medium ${view === "map" ? "bg-primary text-primary-foreground" : "border border-border"}`}
          onClick={() => onViewChange("map")}
          aria-pressed={view === "map"}
        >
          Map
        </button>
      </div>
      {children}
    </div>
  );
}
