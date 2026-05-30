import type { Express, Request } from "express";
import { z } from "zod";
import OpenAI from "openai";
import { storage, geoStorage } from "../storage";
import { requireAuth, requireRole } from "./shared";
import { parseGeoFile } from "../geo/import";
import { safeFetchText } from "../geo/safe-fetch";
import {
  insertMapLayerSchema,
  insertMapFeatureSchema,
  insertMapCategorySchema,
  insertPersonalPlaceSchema,
  insertServiceRegionSchema,
  insertWorkerCoverageZoneSchema,
  type InsertMapFeature,
} from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function visibilitiesForRequest(req: Request): Promise<string[]> {
  const vis = ["public"];
  if (req.session.userId) {
    const user = await storage.getUser(req.session.userId);
    if (user?.role === "carer" || user?.role === "provider") vis.push("staff");
    if (user?.role === "admin") vis.push("staff", "admin");
  }
  return vis;
}

async function isAdmin(req: Request): Promise<boolean> {
  if (!req.session.userId) return false;
  const user = await storage.getUser(req.session.userId);
  return user?.role === "admin";
}

function parseBbox(raw?: string): { minLng: number; minLat: number; maxLng: number; maxLat: number } | undefined {
  if (!raw) return undefined;
  const parts = raw.split(",").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return undefined;
  const [minLng, minLat, maxLng, maxLat] = parts;
  return { minLng, minLat, maxLng, maxLat };
}

export function registerGeoRoutes(app: Express) {
  const adminOnly = requireRole("admin");

  // ---- Categories ----
  app.get("/api/geo/categories", async (_req, res) => {
    res.json(await geoStorage.getMapCategories());
  });
  app.post("/api/geo/categories", adminOnly, async (req, res) => {
    const parsed = insertMapCategorySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid category", errors: parsed.error.flatten() });
    const cat = await geoStorage.createMapCategory(parsed.data);
    await geoStorage.logGeoAudit({ userId: req.session.userId, action: "create", entity: "category", entityId: cat.id, payload: parsed.data });
    res.status(201).json(cat);
  });
  app.patch("/api/geo/categories/:id", adminOnly, async (req, res) => {
    const parsed = insertMapCategorySchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid category", errors: parsed.error.flatten() });
    const cat = await geoStorage.updateMapCategory((req.params as Record<string, string>).id, parsed.data);
    if (!cat) return res.status(404).json({ message: "Not found" });
    await geoStorage.logGeoAudit({ userId: req.session.userId, action: "update", entity: "category", entityId: cat.id, payload: parsed.data });
    res.json(cat);
  });
  app.delete("/api/geo/categories/:id", adminOnly, async (req, res) => {
    await geoStorage.deleteMapCategory((req.params as Record<string, string>).id);
    await geoStorage.logGeoAudit({ userId: req.session.userId, action: "delete", entity: "category", entityId: (req.params as Record<string, string>).id });
    res.status(204).end();
  });

  // ---- Layers ----
  app.get("/api/geo/layers", async (req, res) => {
    const domain = typeof req.query.domain === "string" ? req.query.domain : undefined;
    const visibilities = await visibilitiesForRequest(req);
    const layers = await geoStorage.getMapLayers({ domain, visibilities });
    res.json(layers);
  });
  app.get("/api/geo/layers/:id", async (req, res) => {
    const layer = await geoStorage.getMapLayer((req.params as Record<string, string>).id);
    if (!layer) return res.status(404).json({ message: "Not found" });
    const visibilities = await visibilitiesForRequest(req);
    if (!visibilities.includes(layer.visibility)) return res.status(403).json({ message: "Forbidden" });
    res.json(layer);
  });
  app.post("/api/geo/layers", adminOnly, async (req, res) => {
    const parsed = insertMapLayerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid layer", errors: parsed.error.flatten() });
    const layer = await geoStorage.createMapLayer(parsed.data);
    await geoStorage.logGeoAudit({ userId: req.session.userId, action: "create", entity: "layer", entityId: layer.id, payload: parsed.data });
    res.status(201).json(layer);
  });
  app.patch("/api/geo/layers/:id", adminOnly, async (req, res) => {
    const parsed = insertMapLayerSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid layer", errors: parsed.error.flatten() });
    if (parsed.data.domains !== undefined && (parsed.data.domains?.length ?? 0) === 0) {
      return res.status(400).json({ message: "A layer must belong to at least one domain." });
    }
    const layer = await geoStorage.updateMapLayer((req.params as Record<string, string>).id, parsed.data);
    if (!layer) return res.status(404).json({ message: "Not found" });
    await geoStorage.logGeoAudit({ userId: req.session.userId, action: "update", entity: "layer", entityId: layer.id, payload: parsed.data });
    res.json(layer);
  });
  app.delete("/api/geo/layers/:id", adminOnly, async (req, res) => {
    await geoStorage.deleteFeaturesByLayer((req.params as Record<string, string>).id);
    await geoStorage.deleteMapLayer((req.params as Record<string, string>).id);
    await geoStorage.logGeoAudit({ userId: req.session.userId, action: "delete", entity: "layer", entityId: (req.params as Record<string, string>).id });
    res.status(204).end();
  });

  // ---- Features ----
  app.get("/api/geo/features", async (req, res) => {
    const visibilities = await visibilitiesForRequest(req);
    const allowedLayers = await geoStorage.getMapLayers({ visibilities });
    const allowedIds = new Set(allowedLayers.map((l) => l.id));

    const layerIdParam = typeof req.query.layerId === "string" ? req.query.layerId : undefined;
    const layerIdsParam = typeof req.query.layerIds === "string" ? req.query.layerIds.split(",").filter(Boolean) : undefined;
    let layerIds: string[] | undefined;
    if (layerIdParam) {
      if (!allowedIds.has(layerIdParam)) return res.json([]);
      layerIds = [layerIdParam];
    } else if (layerIdsParam) {
      layerIds = layerIdsParam.filter((id) => allowedIds.has(id));
    } else {
      layerIds = allowedLayers.map((l) => l.id);
    }
    if (layerIds.length === 0) return res.json([]);

    const features = await geoStorage.getMapFeatures({
      layerIds,
      categoryId: typeof req.query.categoryId === "string" ? req.query.categoryId : undefined,
      q: typeof req.query.q === "string" ? req.query.q : undefined,
      bbox: parseBbox(typeof req.query.bbox === "string" ? req.query.bbox : undefined),
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(features);
  });
  app.get("/api/geo/features/:id", async (req, res) => {
    const feature = await geoStorage.getMapFeature((req.params as Record<string, string>).id);
    if (!feature) return res.status(404).json({ message: "Not found" });
    const visibilities = await visibilitiesForRequest(req);
    const allowedLayers = await geoStorage.getMapLayers({ visibilities });
    if (!allowedLayers.some((l) => l.id === feature.layerId)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(feature);
  });
  app.post("/api/geo/features", adminOnly, async (req, res) => {
    const parsed = insertMapFeatureSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid feature", errors: parsed.error.flatten() });
    const feature = await geoStorage.createMapFeature(parsed.data);
    await geoStorage.logGeoAudit({ userId: req.session.userId, action: "create", entity: "feature", entityId: feature.id, payload: parsed.data });
    res.status(201).json(feature);
  });
  app.patch("/api/geo/features/:id", adminOnly, async (req, res) => {
    const parsed = insertMapFeatureSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid feature", errors: parsed.error.flatten() });
    const feature = await geoStorage.updateMapFeature((req.params as Record<string, string>).id, parsed.data);
    if (!feature) return res.status(404).json({ message: "Not found" });
    await geoStorage.logGeoAudit({ userId: req.session.userId, action: "update", entity: "feature", entityId: feature.id, payload: parsed.data });
    res.json(feature);
  });
  app.delete("/api/geo/features/:id", adminOnly, async (req, res) => {
    await geoStorage.deleteMapFeature((req.params as Record<string, string>).id);
    await geoStorage.logGeoAudit({ userId: req.session.userId, action: "delete", entity: "feature", entityId: (req.params as Record<string, string>).id });
    res.status(204).end();
  });

  // ---- Import (KML/GeoJSON paste or URL) ----
  const importSchema = z.object({
    layerId: z.string().optional(),
    newLayer: insertMapLayerSchema.partial({ domains: true }).optional(),
    content: z.string().optional(),
    url: z.string().url().optional(),
    replace: z.boolean().optional(),
  });
  app.post("/api/geo/import", adminOnly, async (req, res) => {
    const parsed = importSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid import request", errors: parsed.error.flatten() });
    const { layerId, newLayer, content, url, replace } = parsed.data;

    let targetLayerId = layerId;
    if (!targetLayerId) {
      if (!newLayer || !newLayer.name || !newLayer.slug) {
        return res.status(400).json({ message: "Provide layerId or newLayer with slug+name" });
      }
      const created = await geoStorage.createMapLayer({
        domains: ["accessibility"],
        ...newLayer,
      } as any);
      targetLayerId = created.id;
    }

    let text = content;
    if (!text && url) {
      try {
        text = await safeFetchText(url);
      } catch (e) {
        return res.status(400).json({ message: `Fetch failed: ${(e as Error).message}` });
      }
    }
    if (!text) return res.status(400).json({ message: "No content or url provided" });

    let parsedFeatures;
    try {
      parsedFeatures = await parseGeoFile(text, { resolveNetworkLinks: true });
    } catch (e) {
      return res.status(400).json({ message: `Parse failed: ${(e as Error).message}` });
    }

    if (replace) await geoStorage.deleteFeaturesByLayer(targetLayerId);

    const rows: InsertMapFeature[] = parsedFeatures.map((f) => ({
      layerId: targetLayerId!,
      name: f.name,
      description: f.description,
      geometry: f.geometry,
      attributes: f.attributes,
      source: "import",
      externalId: f.externalId,
    }));
    const inserted = await geoStorage.bulkCreateMapFeatures(rows);
    await geoStorage.logGeoAudit({ userId: req.session.userId, action: "import", entity: "layer", entityId: targetLayerId, payload: { count: inserted } });
    res.status(201).json({ layerId: targetLayerId, imported: inserted });
  });

  // ---- Geocoding proxy (Nominatim) ----
  app.get("/api/geo/geocode", requireAuth, async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    if (!q.trim()) return res.json([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=au&q=${encodeURIComponent(q)}`;
      const r = await fetch(url, { headers: { "User-Agent": "MapAble/4.0 (accessibility mapping)" } });
      if (!r.ok) return res.status(502).json({ message: "Geocoding service unavailable" });
      const data = (await r.json()) as any[];
      res.json(data.map((d) => ({ name: d.display_name, lat: Number(d.lat), lng: Number(d.lon), type: d.type })));
    } catch (e) {
      res.status(502).json({ message: `Geocoding failed: ${(e as Error).message}` });
    }
  });

  // ---- Personal places ----
  app.get("/api/geo/personal-places", requireAuth, async (req, res) => {
    res.json(await geoStorage.getPersonalPlaces(req.session.userId!));
  });
  app.post("/api/geo/personal-places", requireAuth, async (req, res) => {
    const parsed = insertPersonalPlaceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid place", errors: parsed.error.flatten() });
    const place = await geoStorage.createPersonalPlace(req.session.userId!, parsed.data);
    await geoStorage.logGeoAudit({ userId: req.session.userId, action: "create", entity: "personal_place", entityId: place.id, payload: parsed.data });
    res.status(201).json(place);
  });
  app.delete("/api/geo/personal-places/:id", requireAuth, async (req, res) => {
    await geoStorage.deletePersonalPlace(req.session.userId!, (req.params as Record<string, string>).id);
    await geoStorage.logGeoAudit({ userId: req.session.userId, action: "delete", entity: "personal_place", entityId: (req.params as Record<string, string>).id });
    res.status(204).end();
  });

  // ---- Service regions ----
  app.get("/api/geo/service-regions", requireAuth, async (_req, res) => {
    res.json(await geoStorage.getServiceRegions());
  });
  app.post("/api/geo/service-regions", adminOnly, async (req, res) => {
    const parsed = insertServiceRegionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid region", errors: parsed.error.flatten() });
    const region = await geoStorage.createServiceRegion(parsed.data);
    await geoStorage.logGeoAudit({ userId: req.session.userId, action: "create", entity: "service_region", entityId: region.id, payload: parsed.data });
    res.status(201).json(region);
  });
  app.patch("/api/geo/service-regions/:id", adminOnly, async (req, res) => {
    const parsed = insertServiceRegionSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid region", errors: parsed.error.flatten() });
    const region = await geoStorage.updateServiceRegion((req.params as Record<string, string>).id, parsed.data);
    if (!region) return res.status(404).json({ message: "Not found" });
    await geoStorage.logGeoAudit({ userId: req.session.userId, action: "update", entity: "service_region", entityId: region.id, payload: parsed.data });
    res.json(region);
  });
  app.delete("/api/geo/service-regions/:id", adminOnly, async (req, res) => {
    await geoStorage.deleteServiceRegion((req.params as Record<string, string>).id);
    await geoStorage.logGeoAudit({ userId: req.session.userId, action: "delete", entity: "service_region", entityId: (req.params as Record<string, string>).id });
    res.status(204).end();
  });

  // ---- Worker coverage zones ----
  app.get("/api/geo/worker-coverage", requireAuth, async (req, res) => {
    const worker = await storage.getWorkerByUserId(req.session.userId!);
    if (!worker) return res.status(404).json({ message: "No worker profile" });
    const zone = await geoStorage.getWorkerCoverageZone(worker.id);
    res.json(zone ?? null);
  });
  app.put("/api/geo/worker-coverage", requireAuth, async (req, res) => {
    const worker = await storage.getWorkerByUserId(req.session.userId!);
    if (!worker) return res.status(404).json({ message: "No worker profile" });
    const parsed = insertWorkerCoverageZoneSchema.omit({ workerId: true }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid coverage", errors: parsed.error.flatten() });
    const zone = await geoStorage.upsertWorkerCoverageZone(worker.id, parsed.data);
    await geoStorage.logGeoAudit({ userId: req.session.userId, action: "update", entity: "worker_coverage", entityId: zone.id, payload: parsed.data });
    res.json(zone);
  });
  app.get("/api/geo/worker-coverage/all", adminOnly, async (_req, res) => {
    res.json(await geoStorage.getAllWorkerCoverageZones());
  });

  // ---- Audit log (admin) ----
  app.get("/api/geo/audit", adminOnly, async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    res.json(await geoStorage.getGeoAuditLog(limit));
  });

  // ---- AI Explorer (tool-calling over current viewport) ----
  app.post("/api/geo/ai", requireAuth, async (req, res) => {
    const bodySchema = z.object({
      message: z.string().min(1).max(2000),
      bbox: z.array(z.number()).length(4).optional(),
      activeDomain: z.string().optional(),
      visibleLayerIds: z.array(z.string()).optional(),
    });
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid request", errors: parsed.error.flatten() });
    const { message, bbox, activeDomain, visibleLayerIds } = parsed.data;

    const visibilities = await visibilitiesForRequest(req);
    const allLayers = await geoStorage.getMapLayers({ visibilities });
    const allowedIds = new Set(allLayers.map((l) => l.id));

    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: "function",
        function: {
          name: "search_features",
          description: "Search accessibility map features by text and/or within the current map viewport (bbox). Returns matching features with name, layer and coordinates.",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Free text to match feature name/description, e.g. 'accessible parking'" },
              withinViewport: { type: "boolean", description: "Limit to current map viewport" },
              layerSlug: { type: "string", description: "Optional layer slug to restrict to" },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "set_active_domain",
          description: "Switch the active domain tab on the map.",
          parameters: {
            type: "object",
            properties: { domain: { type: "string", enum: ["accessibility", "care", "transport", "employment"] } },
            required: ["domain"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "toggle_layer",
          description: "Show or hide a map layer by slug.",
          parameters: {
            type: "object",
            properties: { layerSlug: { type: "string" }, visible: { type: "boolean" } },
            required: ["layerSlug", "visible"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "fly_to",
          description: "Move and zoom the map to a coordinate or feature.",
          parameters: {
            type: "object",
            properties: { lat: { type: "number" }, lng: { type: "number" }, zoom: { type: "number" }, label: { type: "string" } },
            required: ["lat", "lng"],
          },
        },
      },
    ];

    const actions: any[] = [];
    const layerBySlug = new Map(allLayers.map((l) => [l.slug, l]));

    async function runTool(name: string, args: any): Promise<any> {
      if (name === "search_features") {
        let layerIds = allLayers.map((l) => l.id);
        if (args.layerSlug && layerBySlug.has(args.layerSlug)) layerIds = [layerBySlug.get(args.layerSlug)!.id];
        const features = await geoStorage.getMapFeatures({
          layerIds,
          q: args.query,
          bbox: args.withinViewport && bbox ? { minLng: bbox[0], minLat: bbox[1], maxLng: bbox[2], maxLat: bbox[3] } : undefined,
          limit: 25,
        });
        const layerName = new Map(allLayers.map((l) => [l.id, l.name]));
        return features.map((f) => ({ id: f.id, name: f.name, layer: layerName.get(f.layerId), lat: f.lat, lng: f.lng }));
      }
      if (name === "set_active_domain") {
        actions.push({ type: "setDomain", domain: args.domain });
        return { ok: true };
      }
      if (name === "toggle_layer") {
        const layer = layerBySlug.get(args.layerSlug);
        if (!layer || !allowedIds.has(layer.id)) return { ok: false, error: "Layer not found" };
        actions.push({ type: "toggleLayer", layerId: layer.id, layerSlug: args.layerSlug, visible: args.visible });
        return { ok: true };
      }
      if (name === "fly_to") {
        actions.push({ type: "flyTo", lat: args.lat, lng: args.lng, zoom: args.zoom ?? 15, label: args.label });
        return { ok: true };
      }
      return { ok: false, error: "Unknown tool" };
    }

    const layerCatalog = allLayers.map((l) => `${l.slug} (${l.name}, domains: ${(l.domains || []).join("/")})`).join("; ");
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are the MapAble Accessibility Map explorer. Help users find accessible places and control the map. Available layers: ${layerCatalog}. Active domain: ${activeDomain ?? "accessibility"}. Visible layers: ${(visibleLayerIds ?? []).join(", ") || "default"}. Use tools to search the map and to fly/toggle/switch domain. Keep replies short, plain-language and accessible. Always mention how many results you found.`,
      },
      { role: "user", content: message },
    ];

    try {
      for (let i = 0; i < 4; i++) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages,
          tools,
          temperature: 0.2,
        });
        const choice = completion.choices[0].message;
        messages.push(choice);
        if (!choice.tool_calls || choice.tool_calls.length === 0) {
          return res.json({ reply: choice.content ?? "", actions });
        }
        for (const tc of choice.tool_calls) {
          if (tc.type !== "function") continue;
          let args: any = {};
          try { args = JSON.parse(tc.function.arguments || "{}"); } catch { /* noop */ }
          const result = await runTool(tc.function.name, args);
          messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
        }
      }
      const final = await openai.chat.completions.create({ model: "gpt-4o", messages, temperature: 0.2 });
      res.json({ reply: final.choices[0].message.content ?? "", actions });
    } catch (e) {
      res.status(502).json({ message: `AI explorer failed: ${(e as Error).message}` });
    }
  });
}
