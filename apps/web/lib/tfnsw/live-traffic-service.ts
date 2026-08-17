import { isTfnswLiveTrafficAvailable } from "@/lib/config/tfnsw";
import { tfnswGetJson } from "@/lib/tfnsw/client";
import { tfnswNotConfiguredError } from "@/lib/tfnsw/tfnsw-api-error";
import type {
  LiveTrafficFeatureCollection,
  LiveTrafficStatus,
  TfnswHazardCategory,
  TfnswHazardState,
} from "@/types/tfnsw";

const LIVE_PREFIX = "/v1/live";

export async function getLiveTrafficStatus(): Promise<LiveTrafficStatus> {
  if (!isTfnswLiveTrafficAvailable()) throw tfnswNotConfiguredError();
  return tfnswGetJson<LiveTrafficStatus>({ path: `${LIVE_PREFIX}/status` });
}

export async function getLiveTrafficCameras(): Promise<LiveTrafficFeatureCollection> {
  if (!isTfnswLiveTrafficAvailable()) throw tfnswNotConfiguredError();
  return tfnswGetJson<LiveTrafficFeatureCollection>({
    path: `${LIVE_PREFIX}/cameras`,
  });
}

/**
 * Fetch hazard GeoJSON. Path pattern: /v1/live/hazards/{category}/{state}
 * e.g. incident/open, roadwork/all
 */
export async function getLiveTrafficHazards(params: {
  category?: TfnswHazardCategory;
  state?: TfnswHazardState;
}): Promise<LiveTrafficFeatureCollection> {
  if (!isTfnswLiveTrafficAvailable()) throw tfnswNotConfiguredError();

  const category = params.category ?? "all";
  const state = params.state ?? "open";
  const suffix =
    category === "all" && state === "all"
      ? "all"
      : `${category}/${state}`;

  return tfnswGetJson<LiveTrafficFeatureCollection>({
    path: `${LIVE_PREFIX}/hazards/${suffix}`,
  });
}

export async function getRegionalLgaParticipation(): Promise<unknown> {
  if (!isTfnswLiveTrafficAvailable()) throw tfnswNotConfiguredError();
  return tfnswGetJson({
    path: `${LIVE_PREFIX}/hazards/regional-lga-participation/all`,
  });
}
