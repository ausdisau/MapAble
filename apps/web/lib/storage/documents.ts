import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { phase2Config } from "@/lib/config/phase2";

const UPLOAD_ROOT = path.join(process.cwd(), ".data", "documents");

export async function storeDocumentFile(
  buffer: Buffer,
  originalName: string
): Promise<{ fileKey: string; mimeType: string; fileSize: number }> {
  if (phase2Config.documentStorageMode !== "local") {
    throw new Error("Only local document storage is configured in Phase 2");
  }

  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 16);
  const fileKey = `${hash}-${safeName}`;
  const dir = UPLOAD_ROOT;
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileKey), buffer);

  return {
    fileKey,
    mimeType: guessMime(safeName),
    fileSize: buffer.length,
  };
}

export async function readDocumentFile(fileKey: string): Promise<Buffer> {
  const safeKey = path.basename(fileKey);
  return readFile(path.join(UPLOAD_ROOT, safeKey));
}

function guessMime(name: string): string {
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
];

export function validateUpload(
  mimeType: string,
  fileSize: number
): string | null {
  const maxBytes = phase2Config.documentMaxUploadMb * 1024 * 1024;
  if (fileSize > maxBytes) {
    return `File must be under ${phase2Config.documentMaxUploadMb} MB`;
  }
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return "File type not allowed";
  }
  return null;
}
