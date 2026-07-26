"use client";

import type { FloorPlanSummary } from "@/lib/access/floor-plan/schemas";

type FloorSelectorProps = {
  floors: FloorPlanSummary[];
  activeFloorId: string;
  onSelectFloor: (floorId: string) => void;
};

export function FloorSelector({ floors, activeFloorId, onSelectFloor }: FloorSelectorProps) {
  return (
    <div role="tablist" aria-label="Floor selection" className="flex flex-wrap gap-2">
      {floors.map((floor) => {
        const selected = floor.id === activeFloorId;
        return (
          <button
            key={floor.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`min-h-11 rounded-xl px-4 text-sm font-bold ${selected ? "bg-[#005B7F] text-white" : "border border-slate-300"}`}
            onClick={() => onSelectFloor(floor.id)}
          >
            {floor.floorName}
            <span className="ml-1 text-xs opacity-80">({floor.floorCode})</span>
          </button>
        );
      })}
    </div>
  );
}
