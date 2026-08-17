import type {
  AccessAccreditationTier,
  AccessConfidenceLevel,
} from "@prisma/client";

import { confidenceLabel } from "@/lib/access/map/access-confidence-service";

export function AccessConfidenceBadge({
  level,
  accreditationTier,
}: {
  level: AccessConfidenceLevel;
  accreditationTier?: AccessAccreditationTier | null;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-sm font-medium text-foreground">
      <span aria-hidden="true">◎</span>
      {confidenceLabel(level, accreditationTier)}
    </span>
  );
}
