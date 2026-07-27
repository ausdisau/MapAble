import type { Express } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { assetStore } from "./assetStore";
import { UnknownBucketError, getBucketConfig } from "./buckets";
import { requireRole } from "../../routes/shared";

/**
 * Register object storage routes for file uploads.
 *
 * This provides example routes for the presigned URL upload flow:
 * 1. POST /api/uploads/request-url - Get a presigned URL for uploading
 * 2. The client then uploads directly to the presigned URL
 *
 * IMPORTANT: These are example routes. Customize based on your use case:
 * - Add authentication middleware for protected uploads
 * - Add file metadata storage (save to database after upload)
 * - Add ACL policies for access control
 */
export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();

  /**
   * Request a presigned URL for file upload.
   *
   * Request body (JSON):
   * {
   *   "name": "filename.jpg",
   *   "size": 12345,
   *   "contentType": "image/jpeg"
   * }
   *
   * Response:
   * {
   *   "uploadURL": "https://storage.googleapis.com/...",
   *   "objectPath": "/objects/uploads/uuid"
   * }
   *
   * IMPORTANT: The client should NOT send the file to this endpoint.
   * Send JSON metadata only, then upload the file directly to uploadURL.
   */
  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();

      // Extract object path from the presigned URL for later reference
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        // Echo back the metadata for client convenience
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  /**
   * Stream an app-managed asset from a named (logical) bucket.
   *
   *   GET /assets/:bucket/<key...>
   *
   * - 200 streams the object with correct Content-Type / Content-Length and a
   *   sensible Cache-Control (immutable for content-hashed keys, short TTL else).
   * - 400 on an unknown bucket name or an invalid (traversal) key.
   * - 403 if the bucket is private-only, or the key is outside the bucket's
   *   configured public prefix.
   * - 404 on a missing object.
   */
  app.get("/assets/:bucket/*key", async (req, res) => {
    const bucket = String(req.params.bucket);
    const rawKey = (req.params as any).key;
    const key = Array.isArray(rawKey) ? rawKey.join("/") : String(rawKey ?? "");
    try {
      // Reject path-traversal attempts before touching storage.
      if (key.length === 0 || key.split("/").some((seg) => seg === "..")) {
        return res.status(400).json({ error: "Invalid object key" });
      }

      // Throws UnknownBucketError (-> 400) for an unregistered bucket name.
      const cfg = getBucketConfig(bucket);

      // Private-only buckets are never served over the public asset route.
      if (cfg.privateOnly) {
        return res.status(403).json({ error: "Bucket is not publicly served" });
      }

      // When a public prefix is configured, only keys under it are servable so
      // private objects (e.g. PRIVATE_OBJECT_DIR content on the default bucket)
      // can never be exposed through this route.
      if (cfg.publicPrefix) {
        const prefix = cfg.publicPrefix.replace(/\/+$/, "");
        if (key !== prefix && !key.startsWith(`${prefix}/`)) {
          return res.status(403).json({ error: "Object is not publicly accessible" });
        }
      }

      const meta = await assetStore.head(bucket, key);
      if (!meta) {
        return res.status(404).json({ error: "Object not found" });
      }

      // Content-hashed paths (e.g. app.9f3c2a1.js) are safe to cache forever.
      const isImmutable = /\.[0-9a-f]{8,}\./i.test(key);
      const cacheControl = isImmutable
        ? "public, max-age=31536000, immutable"
        : "public, max-age=300";

      res.set({
        "Content-Type": meta.contentType || "application/octet-stream",
        ...(meta.size ? { "Content-Length": String(meta.size) } : {}),
        "Cache-Control": cacheControl,
      });

      const stream = assetStore.read(bucket, key);
      stream.on("error", (err) => {
        console.error("Asset stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming asset" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      if (error instanceof UnknownBucketError) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error serving asset:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to serve asset" });
      }
    }
  });

  /**
   * JSON listing of a named bucket for staff/admin tooling.
   *
   *   GET /api/assets/:bucket?prefix=&limit=&pageToken=
   *
   * Auth-gated to admin/provider roles. 400 on an unknown bucket name.
   */
  app.get("/api/assets/:bucket", requireRole("admin", "provider"), async (req, res) => {
    const bucket = String(req.params.bucket);
    const prefix = typeof req.query.prefix === "string" ? req.query.prefix : undefined;
    const pageToken = typeof req.query.pageToken === "string" ? req.query.pageToken : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    try {
      const result = await assetStore.list(bucket, prefix, {
        recursive: true,
        limit: Number.isFinite(limit) ? limit : undefined,
        pageToken,
      });
      res.json(result);
    } catch (error) {
      if (error instanceof UnknownBucketError) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error listing assets:", error);
      res.status(500).json({ error: "Failed to list assets" });
    }
  });

  app.use("/objects", async (req, res, next) => {
    if (req.method !== "GET") return next();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.originalUrl);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}

