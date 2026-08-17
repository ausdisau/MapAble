import { z } from "zod";

const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const routeEstimateSchema = z.object({
  origin: latLngSchema,
  destination: latLngSchema,
  waypoints: z.array(latLngSchema).optional(),
  tripId: z.string().optional(),
});

export const routeMatrixSchema = z.object({
  sources: z.array(latLngSchema).min(1),
  destinations: z.array(latLngSchema).min(1),
});

export const routeOptimiseSchema = z.object({
  tripId: z.string().optional(),
  stops: z.array(latLngSchema).min(2),
  organisationId: z.string().optional(),
});

export const routeCacheRefreshSchema = z.object({
  cacheKey: z.string().optional(),
  tripId: z.string().optional(),
});
