import type { FloorPlanFeature } from "@/lib/access/floor-plan/schemas";
import { formatVerificationFreshness } from "@/lib/access/indoor/status/incident-resolver";

const TRUST_LABELS: Record<string, string> = {
  verified: "MapAble verified",
  venue_claimed: "Venue supplied",
  community_reported: "Community reported",
  not_verified: "Not yet verified",
  disputed: "Disputed",
};

type TrustFreshnessBadgeProps = {
  feature: FloorPlanFeature;
};

export function TrustFreshnessBadge({ feature }: TrustFreshnessBadgeProps) {
  const trust = TRUST_LABELS[feature.status] ?? "Not yet verified";
  const freshness = feature.lastVerifiedAt
    ? formatVerificationFreshness(feature.lastVerifiedAt)
    : "Date not recorded";

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
      <p>
        <span className="font-semibold">Trust:</span> {trust}
      </p>
      <p className="mt-1">
        <span className="font-semibold">Freshness:</span> {freshness}
      </p>
    </div>
  );
}
