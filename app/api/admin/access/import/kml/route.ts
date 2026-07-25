import {
  createImportJob,
  parseImportJobContent,
} from "@/lib/access-import/access-import-job-service";
import {
  MAX_ALLOWLISTED_KML_BYTES,
  MAX_ALLOWLISTED_KML_ITEMS,
  MAX_IMPORT_BYTES,
  MAX_IMPORT_ITEMS,
} from "@/lib/access-import/import-limits";
import {
  fetchAllowlistedKml,
  isAllowlistedNetworkLinkUrl,
  toFetchableAllowlistedKmlUrl,
} from "@/lib/access-import/kml-networklink-service";
import { readTextWithByteLimit } from "@/lib/access-import/read-limited-body";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";

/** Extra bytes for multipart boundaries beyond the file payload. */
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

function isMapableAdlUploadName(fileName: string): boolean {
  return /\bmapable\b/i.test(fileName);
}

function importPayloadToString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value != null && typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function assertPayloadWithinLimit(payload: string, maxBytes: number) {
  const bytes = new TextEncoder().encode(payload).length;
  if (bytes > maxBytes) {
    throw new Error("IMPORT_TOO_LARGE");
  }
}

function importItemLimitResponse(error: unknown) {
  const msg = error instanceof Error ? error.message : "";
  if (msg.startsWith("IMPORT_ITEM_LIMIT:")) {
    return jsonError(
      `Too many features (limit ${MAX_ALLOWLISTED_KML_ITEMS} for MapAble KML, otherwise ${MAX_IMPORT_ITEMS})`,
      413
    );
  }
  return null;
}

function parseJsonImportBody(
  req: Request,
  maxBytes: number
): Promise<Record<string, unknown>> {
  return readTextWithByteLimit(req, maxBytes).then((raw) => {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("INVALID_JSON");
      }
      return parsed as Record<string, unknown>;
    } catch {
      throw new Error("INVALID_JSON");
    }
  });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const uploadLength = req.headers.get("content-length");
    if (uploadLength == null) {
      return jsonError("Content-Length required for multipart uploads", 411);
    }
    const uploadBytes = Number(uploadLength);
    // Content-Length is checked before FormData parsing; allow MapAble ADL size.
    if (
      !Number.isFinite(uploadBytes) ||
      uploadBytes < 0 ||
      uploadBytes > MAX_ALLOWLISTED_KML_BYTES + MULTIPART_OVERHEAD_BYTES
    ) {
      return jsonError("Request body too large", 413);
    }

    const form = await req.formData();
    const file = form.get("file");
    const importType = String(form.get("importType") ?? "kml");

    if (!(file instanceof File)) {
      return jsonError("file required", 400);
    }
    const byteLimit = isMapableAdlUploadName(file.name)
      ? MAX_ALLOWLISTED_KML_BYTES
      : MAX_IMPORT_BYTES;
    if (file.size > byteLimit) {
      return jsonError("File too large", 400);
    }

    const text = await file.text();
    const isGeoJson =
      importType === "geojson" ||
      file.name.endsWith(".geojson") ||
      file.name.endsWith(".json");

    const job = await createImportJob({
      createdById: user.id,
      sourceType: isGeoJson ? "geojson_upload" : "uploaded_kml",
      fileName: file.name,
    });

    try {
      await parseImportJobContent(
        job.id,
        text,
        isGeoJson ? "geojson_upload" : "uploaded_kml"
      );
    } catch (e) {
      const limitResp = importItemLimitResponse(e);
      if (limitResp) return limitResp;
      throw e;
    }

    return jsonOk({ importId: job.id }, 201);
  }

  let body: Record<string, unknown>;
  try {
    // Allowlisted NetworkLink / MapAble payloads may exceed the default JSON limit.
    body = await parseJsonImportBody(req, MAX_ALLOWLISTED_KML_BYTES);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "BODY_TOO_LARGE") {
      return jsonError("Request body too large", 413);
    }
    if (msg === "CONTENT_LENGTH_REQUIRED") {
      return jsonError("Content-Length required for JSON imports", 411);
    }
    return jsonError("Invalid JSON body", 400);
  }

  if (body.networkLinkUrl) {
    const networkLinkUrl = String(body.networkLinkUrl);
    if (!isAllowlistedNetworkLinkUrl(networkLinkUrl)) {
      return jsonError("NetworkLink URL is not on the allowlist", 403);
    }

    const fetchUrl = toFetchableAllowlistedKmlUrl(networkLinkUrl);
    const xml = await fetchAllowlistedKml(fetchUrl);
    const job = await createImportJob({
      createdById: user.id,
      sourceType: "kml_network_link",
      sourceUrl: fetchUrl,
      fileName: "MapAble by Australian Disability Ltd.kml",
    });

    try {
      const result = await parseImportJobContent(job.id, xml, "kml_network_link");
      return jsonOk({ importId: job.id, placemarkCount: result.count }, 201);
    } catch (e) {
      const limitResp = importItemLimitResponse(e);
      if (limitResp) return limitResp;
      throw e;
    }
  }

  if (body.kml) {
    const kmlText = importPayloadToString(body.kml);
    try {
      assertPayloadWithinLimit(kmlText, MAX_ALLOWLISTED_KML_BYTES);
    } catch {
      return jsonError("KML payload too large", 413);
    }
    const job = await createImportJob({
      createdById: user.id,
      sourceType: "uploaded_kml",
      fileName: "MapAble.kml",
    });
    try {
      await parseImportJobContent(job.id, kmlText, "uploaded_kml");
    } catch (e) {
      const limitResp = importItemLimitResponse(e);
      if (limitResp) return limitResp;
      throw e;
    }
    return jsonOk({ importId: job.id }, 201);
  }

  if (body.geojson) {
    const geojsonText = importPayloadToString(body.geojson);
    try {
      assertPayloadWithinLimit(geojsonText, MAX_IMPORT_BYTES);
    } catch {
      return jsonError("GeoJSON payload too large", 413);
    }
    const job = await createImportJob({
      createdById: user.id,
      sourceType: "geojson_upload",
      fileName: "accessible_locations_merged.geojson",
    });
    try {
      await parseImportJobContent(job.id, geojsonText, "geojson_upload");
    } catch (e) {
      const limitResp = importItemLimitResponse(e);
      if (limitResp) return limitResp;
      throw e;
    }
    return jsonOk({ importId: job.id }, 201);
  }

  return jsonError("Provide file upload, kml, geojson, or networkLinkUrl", 400);
}
