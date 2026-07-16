import { FLOOR_PLAN_DISCLAIMER, EMERGENCY_DISCLAIMER } from "@/lib/floor-plan/accessibility-utils";

export function FloorPlanStatusNotice() {
  return (
    <div className="space-y-2 text-xs text-slate-600">
      <p role="note">{FLOOR_PLAN_DISCLAIMER}</p>
      <p role="note">{EMERGENCY_DISCLAIMER}</p>
    </div>
  );
}
