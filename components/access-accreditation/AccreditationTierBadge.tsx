import type { AccessAccreditationTier } from "@prisma/client";

import { tierLabel } from "@/lib/access-accreditation/accreditation-scoring-service";

export function AccreditationTierBadge({
  tier,
  totalScore,
}: {
  tier: AccessAccreditationTier | string;
  totalScore: number;
}) {
  const label = tierLabel(tier as AccessAccreditationTier);
  return (
    <div className="inline-flex flex-col rounded-lg border-2 border-foreground px-3 py-2">
      <span className="text-sm font-medium">MapAble Accredited</span>
      <span className="text-lg font-bold capitalize">
        {String(tier)} — {label}
      </span>
      <span className="text-sm">Score: {totalScore.toFixed(1)} / 100</span>
    </div>
  );
}
