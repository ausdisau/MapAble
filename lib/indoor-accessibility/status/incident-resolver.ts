import type { OperationalStatus, TrustLevel } from "@/lib/indoor-accessibility/schemas/core";

export type StatusSource = {
  trustLevel: TrustLevel;
  operationalStatus: OperationalStatus;
  reportedAt: string;
  verifiedAt?: string;
  expiresAt?: string;
};

const TRUST_PRECEDENCE: TrustLevel[] = [
  "mapable_verified",
  "independent_assessor_verified",
  "venue_supplied",
  "community_reported",
  "not_verified",
];

export function resolveFeatureOperationalStatus(
  staticStatus: OperationalStatus | undefined,
  incidents: StatusSource[],
  now = new Date(),
): { status: OperationalStatus; source: TrustLevel; label: string } {
  const active = incidents.filter((i) => {
    if (i.expiresAt && new Date(i.expiresAt) < now) return false;
    return true;
  });

  active.sort(
    (a, b) =>
      TRUST_PRECEDENCE.indexOf(a.trustLevel) - TRUST_PRECEDENCE.indexOf(b.trustLevel),
  );

  if (active.length > 0) {
    const top = active[0];
    return {
      status: top.operationalStatus,
      source: top.trustLevel,
      label: formatStatusLabel(top),
    };
  }

  return {
    status: staticStatus ?? "unknown",
    source: "not_verified",
    label: staticStatus === "available" ? "Status unknown" : "No recent status reports",
  };
}

function formatStatusLabel(source: StatusSource): string {
  const trust =
    source.trustLevel === "mapable_verified"
      ? "MapAble verified"
      : source.trustLevel === "venue_supplied"
        ? "Venue supplied"
        : source.trustLevel === "community_reported"
          ? "Community reported"
          : "Not yet verified";
  return `${trust} — ${source.operationalStatus.replace(/_/g, " ")}`;
}

export function formatVerificationFreshness(verifiedAt: string | null | undefined): string {
  if (!verifiedAt) return "Date not recorded";
  const date = new Date(verifiedAt);
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Verified today";
  if (days === 1) return "Verified yesterday";
  if (days < 30) return `Verified ${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Last checked ${months} month${months === 1 ? "" : "s"} ago`;
  return `Last checked ${Math.floor(months / 12)} year${Math.floor(months / 12) === 1 ? "" : "s"} ago`;
}
