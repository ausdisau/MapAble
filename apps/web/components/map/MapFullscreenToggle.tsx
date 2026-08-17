"use client";

import { Maximize2, Minimize2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function MapFullscreenToggle({
  expanded,
  onToggle,
  controlsId,
}: {
  expanded: boolean;
  onToggle: () => void;
  controlsId: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="absolute right-2 top-2 z-10 bg-background/90"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={controlsId}
      aria-label={expanded ? "Exit fullscreen map" : "View map fullscreen"}
    >
      {expanded ? (
        <Minimize2 className="h-4 w-4" aria-hidden />
      ) : (
        <Maximize2 className="h-4 w-4" aria-hidden />
      )}
    </Button>
  );
}
