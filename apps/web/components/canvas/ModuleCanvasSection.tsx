import React from "react";

import { BoundaryNotice } from "@/components/canvas/BoundaryNotice";
import { CanvasBlockGrid } from "@/components/canvas/CanvasBlockGrid";
import { CanvasPositioningBanner } from "@/components/canvas/CanvasPositioningBanner";
import { DigitalTwinLayer } from "@/components/canvas/DigitalTwinLayer";
import type { CanvasModule } from "@/lib/canvas/canvas-data";
import { digitalTwinCards } from "@/lib/canvas/canvas-data";
import { getBlocksForModule } from "@/lib/canvas/canvas-filters";

const moduleLabels: Record<CanvasModule, string> = {
  care: "MapAble Care",
  transport: "MapAble Transport",
  access: "MapAble Access",
  employment: "MapAble Employment",
  core: "MapAble Core",
  jobs: "MapAble Jobs",
  planops: "PlanOps",
};

type ModuleCanvasSectionProps = {
  module: CanvasModule;
  showDigitalTwin?: boolean;
};

export function ModuleCanvasSection({
  module,
}: ModuleCanvasSectionProps) {
  const blocks = getBlocksForModule(module);
  const label = moduleLabels[module];

  return (
    <>
      <CanvasPositioningBanner variant="module" moduleLabel={label} />
      <CanvasBlockGrid
        blocks={blocks}
        title={`${label} capabilities`}
        id={`${module}-canvas-blocks`}
        description={`How ${label} connects to the MapAble Complete Support ecosystem.`}
        showLinks={false}
      />
      <BoundaryNotice />
    </>
  );
}

export function ModuleCanvasExtras({
  module,
  showDigitalTwin = false,
}: ModuleCanvasSectionProps) {
  if (module === "access" && showDigitalTwin) {
    return <DigitalTwinLayer cards={digitalTwinCards} />;
  }
  return null;
}
