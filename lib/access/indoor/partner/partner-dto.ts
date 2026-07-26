/** Partner API public DTOs — never expose raw database rows. */

export type PartnerVenueSummary = {
  id: string;
  name: string;
  category?: string;
  suburb?: string;
  hasFloorPlan: boolean;
  floorPlanCount: number;
  lastVerifiedAt: string | null;
};

export type PartnerFloorPlanSummary = {
  id: string;
  floorCode: string;
  floorName: string;
  featureCount: number;
};

export type PartnerAccessibilityFeature = {
  id: string;
  type: string;
  name: string;
  trustLevel: string;
  operationalStatus?: string;
  measurements?: Record<string, number | string>;
};

export function toPartnerVenueSummary(place: {
  id: string;
  name: string;
  category?: string;
  suburb?: string | null;
  hasFloorPlan: boolean;
  floorPlanCount: number;
  lastVerifiedAt: string | null;
}): PartnerVenueSummary {
  return {
    id: place.id,
    name: place.name,
    category: place.category,
    suburb: place.suburb ?? undefined,
    hasFloorPlan: place.hasFloorPlan,
    floorPlanCount: place.floorPlanCount,
    lastVerifiedAt: place.lastVerifiedAt,
  };
}

export const PARTNER_API_DISCLAIMER =
  "MapAble partner data describes observed accessibility features. It is not legal compliance certification.";
