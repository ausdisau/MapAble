/** Read request body up to maxBytes (rejects oversized payloads after read). */
export async function readTextWithByteLimit(
  req: Request,
  maxBytes: number
): Promise<string> {
  const contentLength = req.headers.get("content-length");
  if (contentLength == null) {
    throw new Error("CONTENT_LENGTH_REQUIRED");
  }
  const n = Number(contentLength);
  if (!Number.isFinite(n) || n < 0 || n > maxBytes) {
    throw new Error("BODY_TOO_LARGE");
  }

  const text = await req.text();
  if (new TextEncoder().encode(text).length > maxBytes) {
    throw new Error("BODY_TOO_LARGE");
  }
  return text;
}
