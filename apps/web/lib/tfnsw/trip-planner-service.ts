import { isTfnswTripPlannerAvailable } from "@/lib/config/tfnsw";
import { tfnswGetJson } from "@/lib/tfnsw/client";
import { tfnswNotConfiguredError } from "@/lib/tfnsw/tfnsw-api-error";
import type {
  TripPlannerDepartureParams,
  TripPlannerStopFinderParams,
} from "@/types/tfnsw";

const TP_PREFIX = "/v1/tp";

function formatItdDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function formatItdTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}${min}`;
}

/** Departures at a stop (departure board) — rapidJSON from TfNSW Trip Planner */
export async function getDeparturesAtStop(
  params: TripPlannerDepartureParams
): Promise<unknown> {
  if (!isTfnswTripPlannerAvailable()) throw tfnswNotConfiguredError();

  const when = new Date();
  const query: Record<string, string> = {
    outputFormat: "rapidJSON",
    coordOutputFormat: "EPSG:4326",
    mode: "direct",
    type_dm: "stop",
    name_dm: params.stopId,
    depArrMacro: "dep",
    itdDate: params.itdDate ?? formatItdDate(when),
    itdTime: params.itdTime ?? formatItdTime(when),
    TfNSWDM: "true",
  };

  if (params.platformId) {
    query.nameKey_dm = "$USEPOINT$";
    query.name_dm = params.platformId;
  }

  return tfnswGetJson({
    path: `${TP_PREFIX}/departure_mon`,
    query,
  });
}

/** Stop / address autocomplete for trip planning */
export async function findStops(params: TripPlannerStopFinderParams): Promise<unknown> {
  if (!isTfnswTripPlannerAvailable()) throw tfnswNotConfiguredError();

  return tfnswGetJson({
    path: `${TP_PREFIX}/stop_finder`,
    query: {
      outputFormat: "rapidJSON",
      coordOutputFormat: "EPSG:4326",
      type_sf: "any",
      name_sf: params.query,
      maxNo: String(params.maxResults ?? 10),
      TfNSWDM: "true",
    },
  });
}

/** Service alerts (incidents affecting public transport) */
export async function getServiceAlerts(): Promise<unknown> {
  if (!isTfnswTripPlannerAvailable()) throw tfnswNotConfiguredError();

  return tfnswGetJson({
    path: `${TP_PREFIX}/service_alert`,
    query: {
      outputFormat: "rapidJSON",
      TfNSWDM: "true",
    },
  });
}

/** Stops near a coordinate */
export async function getStopsNearCoordinate(params: {
  lat: number;
  lng: number;
  radiusMetres?: number;
}): Promise<unknown> {
  if (!isTfnswTripPlannerAvailable()) throw tfnswNotConfiguredError();

  return tfnswGetJson({
    path: `${TP_PREFIX}/coord`,
    query: {
      outputFormat: "rapidJSON",
      coordOutputFormat: "EPSG:4326",
      coord: `${params.lng}:${params.lat}:EPSG:4326`,
      inclFilter: "1",
      radius_1: String(params.radiusMetres ?? 500),
      TfNSWDM: "true",
    },
  });
}
