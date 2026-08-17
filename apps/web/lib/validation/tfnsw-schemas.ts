import { z } from "zod";

const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const trafficHazardsQuerySchema = z.object({
  category: z
    .enum([
      "incident",
      "fire",
      "flood",
      "alpine",
      "majorevent",
      "roadwork",
      "floodalpine",
      "all",
    ])
    .optional()
    .default("incident"),
  state: z.enum(["open", "closed", "all"]).optional().default("open"),
});

export const trafficNearbySchema = z.object({
  origin: latLngSchema,
  destination: latLngSchema,
  waypoints: z.array(latLngSchema).optional(),
  maxHazards: z.number().int().min(1).max(50).optional(),
  radiusMetres: z.number().int().min(100).max(50_000).optional(),
});

export const tpDeparturesSchema = z.object({
  stopId: z.string().min(1),
  itdDate: z.string().regex(/^\d{8}$/).optional(),
  itdTime: z.string().regex(/^\d{4}$/).optional(),
  platformId: z.string().optional(),
});

export const tpStopFinderSchema = z.object({
  query: z.string().min(1).max(200),
  maxResults: z.number().int().min(1).max(50).optional(),
});

export const tpCoordSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusMetres: z.number().int().min(50).max(5000).optional(),
});
