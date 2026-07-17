import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "access");

export async function saveAccessMediaFile(params: {
  buffer: Buffer;
  mimeType: string;
  prefix: "reviews" | "accreditation" | "venue";
}): Promise<string> {
  const ext =
    params.mimeType === "image/png"
      ? ".png"
      : params.mimeType === "image/webp"
        ? ".webp"
        : ".jpg";
  const dir = path.join(UPLOAD_ROOT, params.prefix);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}${ext}`;
  const full = path.join(dir, name);
  await writeFile(full, params.buffer);
  return path.relative(process.cwd(), full);
}
