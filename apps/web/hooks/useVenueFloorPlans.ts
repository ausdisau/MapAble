"use client";

import { useQuery } from "@tanstack/react-query";

import type {
  VenueFloorPlanDetailResponse,
  VenueFloorPlanListResponse,
} from "@/lib/access/floor-plan/schemas";

async function fetchFloorPlanSummaries(
  venueId: string,
): Promise<VenueFloorPlanListResponse> {
  const res = await fetch(`/api/access/places/${encodeURIComponent(venueId)}/floor-plans`);
  if (!res.ok) {
    throw new Error("Failed to load floor plan summaries");
  }
  return res.json();
}

async function fetchFloorPlanDetail(
  venueId: string,
  floorPlanId: string,
): Promise<VenueFloorPlanDetailResponse> {
  const res = await fetch(
    `/api/access/places/${encodeURIComponent(venueId)}/floor-plans/${encodeURIComponent(floorPlanId)}`,
  );
  if (!res.ok) {
    throw new Error("Failed to load floor plan");
  }
  return res.json();
}

export function useVenueFloorPlanSummaries(venueId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["floor-plans", venueId],
    queryFn: () => fetchFloorPlanSummaries(venueId!),
    enabled: Boolean(venueId) && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useVenueFloorPlanDetail(
  venueId: string | undefined,
  floorPlanId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ["floor-plan", venueId, floorPlanId],
    queryFn: () => fetchFloorPlanDetail(venueId!, floorPlanId!),
    enabled: Boolean(venueId) && Boolean(floorPlanId) && enabled,
    staleTime: 5 * 60 * 1000,
  });
}
