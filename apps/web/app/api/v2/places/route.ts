import { createHash } from "crypto";

import type { ApiScope } from "@prisma/client";

import { listAccessiblePlaces } from "@/lib/access/accessibility-map/place-service";
import { listPublishedPlaces } from "@/lib/access/map/access-place-service";
import { scopesAllow } from "@/lib/api/developer/api-key-service";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getApiVersionPolicy } from "@/lib/api/versioning/version-policy-service";
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
  const policy = await getApiVersionPolicy();
  const v2 = policy.versions.find((v) => v.version === "v2");
  if (v2?.status === "sunset") {
    return jsonError("API v2 sunset", 410);
  }

  const record = await authenticateApiKey(req);
  if (!record) return jsonError("Unauthorized", 401);
  if (!scopesAllow(record.scopes, "places_read" as ApiScope)) {
    return jsonError("Forbidden scope", 403);
  }

  const accessPlaces = await listPublishedPlaces(50);
  const places =
    accessPlaces.length > 0
      ? accessPlaces.map((p) => ({
          id: p.id,
          name: p.name,
          confidence: p.confidence,
          features: p.features.map((f) => f.type),
        }))
      : (await listAccessiblePlaces(50)).map((p) => ({
          id: p.id,
          name: p.name,
          confidence: p.confidence,
          features: p.features.map((f) => f.type),
        }));

  const safe = places.map((p) => ({
    ...p,
    apiVersion: "v2",
    meta: { paginationHint: "cursor not yet implemented" },
  }));

  return jsonOk({
    version: "v2",
    status: v2?.status ?? "draft",
    places: safe,
  });
}
