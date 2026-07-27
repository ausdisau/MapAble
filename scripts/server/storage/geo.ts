import {
  type MapCategory, type InsertMapCategory,
  type MapLayer, type InsertMapLayer,
  type MapFeature, type InsertMapFeature,
  type PersonalPlace, type InsertPersonalPlace,
  type ServiceRegion, type InsertServiceRegion,
  type WorkerCoverageZone, type InsertWorkerCoverageZone,
  type InsertGeoAuditLog, type GeoAuditLog,
  mapCategories, mapLayers, mapFeatures, personalPlaces,
  serviceRegions, workerCoverageZones, geoAuditLog,
} from "@shared/schema";
import { db } from "../db";
import { eq, and, sql, desc, gte, lte, ilike, or, inArray } from "drizzle-orm";

function computeBounds(geometry: { type: string; coordinates: any }): {
  lat?: string; lng?: string; minLat?: string; maxLat?: string; minLng?: string; maxLng?: string;
} {
  const lats: number[] = [];
  const lngs: number[] = [];
  const walk = (coords: any) => {
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      lngs.push(coords[0]);
      lats.push(coords[1]);
    } else if (Array.isArray(coords)) {
      coords.forEach(walk);
    }
  };
  if (geometry?.coordinates) walk(geometry.coordinates);
  if (lats.length === 0) return {};
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  return {
    lat: String((minLat + maxLat) / 2),
    lng: String((minLng + maxLng) / 2),
    minLat: String(minLat), maxLat: String(maxLat),
    minLng: String(minLng), maxLng: String(maxLng),
  };
}

export const geoStorage = {
  // ---- Categories ----
  async getMapCategories(): Promise<MapCategory[]> {
    return db.select().from(mapCategories).orderBy(mapCategories.name);
  },
  async createMapCategory(data: InsertMapCategory): Promise<MapCategory> {
    const [row] = await db.insert(mapCategories).values(data).returning();
    return row;
  },
  async updateMapCategory(id: string, data: Partial<InsertMapCategory>): Promise<MapCategory | undefined> {
    const [row] = await db.update(mapCategories).set(data).where(eq(mapCategories.id, id)).returning();
    return row;
  },
  async deleteMapCategory(id: string): Promise<void> {
    await db.delete(mapCategories).where(eq(mapCategories.id, id));
  },

  // ---- Layers ----
  async getMapLayers(filters?: { domain?: string; visibilities?: string[] }): Promise<MapLayer[]> {
    const conditions = [];
    if (filters?.domain) {
      conditions.push(sql`${filters.domain} = ANY(${mapLayers.domains})`);
    }
    if (filters?.visibilities && filters.visibilities.length > 0) {
      conditions.push(inArray(mapLayers.visibility, filters.visibilities as any));
    }
    const q = db.select().from(mapLayers);
    if (conditions.length > 0) {
      return q.where(and(...conditions)).orderBy(mapLayers.ordering, mapLayers.name);
    }
    return q.orderBy(mapLayers.ordering, mapLayers.name);
  },
  async getMapLayer(id: string): Promise<MapLayer | undefined> {
    const [row] = await db.select().from(mapLayers).where(eq(mapLayers.id, id));
    return row;
  },
  async getMapLayerBySlug(slug: string): Promise<MapLayer | undefined> {
    const [row] = await db.select().from(mapLayers).where(eq(mapLayers.slug, slug));
    return row;
  },
  async createMapLayer(data: InsertMapLayer): Promise<MapLayer> {
    const [row] = await db.insert(mapLayers).values(data).returning();
    return row;
  },
  async updateMapLayer(id: string, data: Partial<InsertMapLayer>): Promise<MapLayer | undefined> {
    const [row] = await db.update(mapLayers).set({ ...data, updatedAt: new Date() }).where(eq(mapLayers.id, id)).returning();
    return row;
  },
  async deleteMapLayer(id: string): Promise<void> {
    await db.delete(mapFeatures).where(eq(mapFeatures.layerId, id));
    await db.delete(mapLayers).where(eq(mapLayers.id, id));
  },

  // ---- Features ----
  async getMapFeatures(filters: {
    layerId?: string; layerIds?: string[]; categoryId?: string; q?: string;
    bbox?: { minLng: number; minLat: number; maxLng: number; maxLat: number };
    limit?: number;
  }): Promise<MapFeature[]> {
    const conditions = [];
    if (filters.layerId) conditions.push(eq(mapFeatures.layerId, filters.layerId));
    if (filters.layerIds && filters.layerIds.length > 0) conditions.push(inArray(mapFeatures.layerId, filters.layerIds));
    if (filters.categoryId) conditions.push(eq(mapFeatures.categoryId, filters.categoryId));
    if (filters.q) {
      conditions.push(or(
        ilike(mapFeatures.name, `%${filters.q}%`),
        ilike(mapFeatures.description, `%${filters.q}%`),
      ));
    }
    if (filters.bbox) {
      // Overlap test using feature bounds (numeric cast on text columns)
      const { minLng, minLat, maxLng, maxLat } = filters.bbox;
      conditions.push(sql`CAST(${mapFeatures.maxLat} AS double precision) >= ${minLat}`);
      conditions.push(sql`CAST(${mapFeatures.minLat} AS double precision) <= ${maxLat}`);
      conditions.push(sql`CAST(${mapFeatures.maxLng} AS double precision) >= ${minLng}`);
      conditions.push(sql`CAST(${mapFeatures.minLng} AS double precision) <= ${maxLng}`);
    }
    const q = db.select().from(mapFeatures);
    const limit = filters.limit ?? 2000;
    if (conditions.length > 0) {
      return q.where(and(...conditions)).limit(limit);
    }
    return q.limit(limit);
  },
  async getMapFeature(id: string): Promise<MapFeature | undefined> {
    const [row] = await db.select().from(mapFeatures).where(eq(mapFeatures.id, id));
    return row;
  },
  async countMapFeaturesByLayer(layerId: string): Promise<number> {
    const [row] = await db.select({ c: sql<number>`count(*)::int` }).from(mapFeatures).where(eq(mapFeatures.layerId, layerId));
    return row?.c ?? 0;
  },
  async createMapFeature(data: InsertMapFeature): Promise<MapFeature> {
    const bounds = computeBounds(data.geometry as any);
    const [row] = await db.insert(mapFeatures).values({ ...data, ...bounds }).returning();
    return row;
  },
  async bulkCreateMapFeatures(rows: InsertMapFeature[]): Promise<number> {
    if (rows.length === 0) return 0;
    const withBounds = rows.map(r => ({ ...r, ...computeBounds(r.geometry as any) }));
    // chunk to avoid parameter limits
    let count = 0;
    for (let i = 0; i < withBounds.length; i += 500) {
      const chunk = withBounds.slice(i, i + 500);
      const inserted = await db.insert(mapFeatures).values(chunk).returning({ id: mapFeatures.id });
      count += inserted.length;
    }
    return count;
  },
  async updateMapFeature(id: string, data: Partial<InsertMapFeature>): Promise<MapFeature | undefined> {
    const patch: Record<string, any> = { ...data, updatedAt: new Date() };
    if (data.geometry) Object.assign(patch, computeBounds(data.geometry as any));
    const [row] = await db.update(mapFeatures).set(patch).where(eq(mapFeatures.id, id)).returning();
    return row;
  },
  async deleteMapFeature(id: string): Promise<void> {
    await db.delete(mapFeatures).where(eq(mapFeatures.id, id));
  },
  async deleteFeaturesByLayer(layerId: string): Promise<void> {
    await db.delete(mapFeatures).where(eq(mapFeatures.layerId, layerId));
  },

  // ---- Personal places ----
  async getPersonalPlaces(userId: string): Promise<PersonalPlace[]> {
    return db.select().from(personalPlaces).where(eq(personalPlaces.userId, userId)).orderBy(desc(personalPlaces.createdAt));
  },
  async createPersonalPlace(userId: string, data: InsertPersonalPlace): Promise<PersonalPlace> {
    const [row] = await db.insert(personalPlaces).values({ ...data, userId }).returning();
    return row;
  },
  async deletePersonalPlace(userId: string, id: string): Promise<void> {
    await db.delete(personalPlaces).where(and(eq(personalPlaces.id, id), eq(personalPlaces.userId, userId)));
  },

  // ---- Service regions ----
  async getServiceRegions(): Promise<ServiceRegion[]> {
    return db.select().from(serviceRegions).orderBy(serviceRegions.name);
  },
  async createServiceRegion(data: InsertServiceRegion): Promise<ServiceRegion> {
    const [row] = await db.insert(serviceRegions).values(data).returning();
    return row;
  },
  async updateServiceRegion(id: string, data: Partial<InsertServiceRegion>): Promise<ServiceRegion | undefined> {
    const [row] = await db.update(serviceRegions).set(data).where(eq(serviceRegions.id, id)).returning();
    return row;
  },
  async deleteServiceRegion(id: string): Promise<void> {
    await db.delete(serviceRegions).where(eq(serviceRegions.id, id));
  },

  // ---- Worker coverage ----
  async getWorkerCoverageZone(workerId: string): Promise<WorkerCoverageZone | undefined> {
    const [row] = await db.select().from(workerCoverageZones).where(eq(workerCoverageZones.workerId, workerId));
    return row;
  },
  async getAllWorkerCoverageZones(): Promise<WorkerCoverageZone[]> {
    return db.select().from(workerCoverageZones);
  },
  async upsertWorkerCoverageZone(workerId: string, data: Partial<InsertWorkerCoverageZone>): Promise<WorkerCoverageZone> {
    const { workerId: _ignored, ...safeData } = data as Record<string, unknown>;
    const existing = await this.getWorkerCoverageZone(workerId);
    if (existing) {
      const [row] = await db.update(workerCoverageZones)
        .set({ ...safeData, updatedAt: new Date() } as any)
        .where(eq(workerCoverageZones.workerId, workerId)).returning();
      return row;
    }
    const [row] = await db.insert(workerCoverageZones).values({ ...safeData, workerId } as any).returning();
    return row;
  },

  // ---- Audit log ----
  async logGeoAudit(data: InsertGeoAuditLog): Promise<void> {
    await db.insert(geoAuditLog).values(data);
  },
  async getGeoAuditLog(limit = 100): Promise<GeoAuditLog[]> {
    return db.select().from(geoAuditLog).orderBy(desc(geoAuditLog.createdAt)).limit(limit);
  },
};
