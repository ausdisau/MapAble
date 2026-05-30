import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const geoDomainEnum = pgEnum("geo_domain", ["accessibility", "care", "transport", "employment"]);
export const geoVisibilityEnum = pgEnum("geo_visibility", ["public", "staff", "admin"]);
export const geoGeometryTypeEnum = pgEnum("geo_geometry_type", ["Point", "LineString", "Polygon", "MultiLineString", "MultiPolygon"]);

export const mapCategories = pgTable("map_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mapLayers = pgTable("map_layers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  domains: text("domains").array().notNull().default(sql`ARRAY['accessibility']::text[]`),
  visibility: geoVisibilityEnum("visibility").notNull().default("public"),
  icon: text("icon"),
  color: text("color"),
  attribution: text("attribution"),
  sourceUrl: text("source_url"),
  geometryType: geoGeometryTypeEnum("geometry_type").notNull().default("Point"),
  defaultVisible: boolean("default_visible").notNull().default(true),
  ordering: integer("ordering").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mapFeatures = pgTable("map_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  layerId: varchar("layer_id").notNull(),
  categoryId: varchar("category_id"),
  name: text("name").notNull(),
  description: text("description"),
  geometry: jsonb("geometry").notNull().$type<{
    type: "Point" | "LineString" | "Polygon" | "MultiLineString" | "MultiPolygon";
    coordinates: any;
  }>(),
  // Denormalized for fast bbox queries (centroid for non-points)
  lat: text("lat"),
  lng: text("lng"),
  minLat: text("min_lat"),
  maxLat: text("max_lat"),
  minLng: text("min_lng"),
  maxLng: text("max_lng"),
  attributes: jsonb("attributes").$type<Record<string, any>>().default({}),
  source: text("source"),
  externalId: text("external_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const personalPlaces = pgTable("personal_places", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  tag: text("tag"),
  lat: text("lat").notNull(),
  lng: text("lng").notNull(),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const serviceRegions = pgTable("service_regions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  organizationId: varchar("organization_id"),
  geometry: jsonb("geometry").notNull().$type<{
    type: "Polygon" | "MultiPolygon";
    coordinates: any;
  }>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workerCoverageZones = pgTable("worker_coverage_zones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workerId: varchar("worker_id").notNull(),
  // One of: polygon | suburbs | radius
  mode: text("mode").notNull().default("polygon"),
  geometry: jsonb("geometry").$type<{ type: string; coordinates: any } | null>(),
  suburbs: text("suburbs").array(),
  centerLat: text("center_lat"),
  centerLng: text("center_lng"),
  radiusKm: text("radius_km"),
  maxTravelMins: integer("max_travel_mins"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  workerIdUnique: uniqueIndex("worker_coverage_zones_worker_id_key").on(t.workerId),
}));

export const geoAuditLog = pgTable("geo_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  action: text("action").notNull(), // create|update|delete|import
  entity: text("entity").notNull(), // layer|feature|category|region|coverage
  entityId: text("entity_id"),
  payload: jsonb("payload").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMapCategorySchema = createInsertSchema(mapCategories).omit({ id: true, createdAt: true });
export const insertMapLayerSchema = createInsertSchema(mapLayers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMapFeatureSchema = createInsertSchema(mapFeatures).omit({
  id: true, createdAt: true, updatedAt: true, lat: true, lng: true, minLat: true, maxLat: true, minLng: true, maxLng: true,
});
export const insertPersonalPlaceSchema = createInsertSchema(personalPlaces).omit({ id: true, createdAt: true, userId: true });
export const insertServiceRegionSchema = createInsertSchema(serviceRegions).omit({ id: true, createdAt: true });
export const insertWorkerCoverageZoneSchema = createInsertSchema(workerCoverageZones).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGeoAuditLogSchema = createInsertSchema(geoAuditLog).omit({ id: true, createdAt: true });

export type MapCategory = typeof mapCategories.$inferSelect;
export type InsertMapCategory = z.infer<typeof insertMapCategorySchema>;
export type MapLayer = typeof mapLayers.$inferSelect;
export type InsertMapLayer = z.infer<typeof insertMapLayerSchema>;
export type MapFeature = typeof mapFeatures.$inferSelect;
export type InsertMapFeature = z.infer<typeof insertMapFeatureSchema>;
export type PersonalPlace = typeof personalPlaces.$inferSelect;
export type InsertPersonalPlace = z.infer<typeof insertPersonalPlaceSchema>;
export type ServiceRegion = typeof serviceRegions.$inferSelect;
export type InsertServiceRegion = z.infer<typeof insertServiceRegionSchema>;
export type WorkerCoverageZone = typeof workerCoverageZones.$inferSelect;
export type InsertWorkerCoverageZone = z.infer<typeof insertWorkerCoverageZoneSchema>;
export type GeoAuditLog = typeof geoAuditLog.$inferSelect;
export type InsertGeoAuditLog = z.infer<typeof insertGeoAuditLogSchema>;

export type GeoDomain = "accessibility" | "care" | "transport" | "employment";
