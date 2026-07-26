import { createHash } from "crypto";

import type { ApiScope } from "@prisma/client";

import { listAccessiblePlaces } from "@/lib/access/accessibility-map/place-service";
import { jsonError, jsonOk } from "@/lib/api/response";
import { scopesAllow } from "@/lib/api/developer/api-key-service";
import { prisma } from "@/lib/prisma";



async function authenticateApiKey(req: Request) {
  const key = req.headers.get("x-api-key");
  if (!key) return null;
  const hash = createHash("sha256").update(key).digest("hex");
  const record = await prisma.developerApiKey.findFirst({
    where: { keyHash: hash, revokedAt: null },
    include: { app: true },
  });
  if (!record || record.app.status !== "approved") return null;
  return record;
}

export async function GET(req: Request) {
  const record = await authenticateApiKey(req);
  if (!record) return jsonError("Unauthorized", 401);
  if (!scopesAllow(record.scopes, "places_read" as ApiScope)) {
    return jsonError("Forbidden scope", 403);
  }
  const places = await listAccessiblePlaces(30);
  const safe = places.map((p) => ({
    id: p.id,
    name: p.name,
    confidence: p.confidence,
    features: p.features.map((f) => f.type),
  }));
  return jsonOk({ places: safe });
}
