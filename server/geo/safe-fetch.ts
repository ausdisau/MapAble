import dns from "node:dns/promises";
import net from "node:net";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB cap
const FETCH_TIMEOUT_MS = 10_000;

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true; // multicast/reserved
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fe80")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
  // IPv4-mapped IPv6 (::ffff:a.b.c.d)
  const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIp(mapped[1]);
  return false;
}

/**
 * Validate a URL is safe to fetch server-side: only http(s), public hostnames,
 * and no DNS resolution to private/internal/link-local addresses (SSRF guard).
 */
export async function assertSafeUrl(rawUrl: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http(s) URLs are allowed");
  }
  const host = url.hostname;
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("URL resolves to a private address");
    return;
  }
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new Error("URL resolves to a private address");
  }
  const records = await dns.lookup(host, { all: true });
  if (records.length === 0) throw new Error("Host did not resolve");
  for (const r of records) {
    if (isPrivateIp(r.address)) throw new Error("URL resolves to a private address");
  }
}

/**
 * SSRF-safe text fetch with timeout and size cap. Throws on unsafe URLs,
 * non-2xx responses, timeouts, or oversized bodies.
 */
export async function safeFetchText(rawUrl: string): Promise<string> {
  await assertSafeUrl(rawUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(rawUrl, {
      redirect: "error",
      signal: controller.signal,
      headers: { "User-Agent": "MapAble/4.0 (accessibility mapping)" },
    });
    if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
    const lenHeader = res.headers.get("content-length");
    if (lenHeader && Number(lenHeader) > MAX_BYTES) throw new Error("Remote file too large");
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) throw new Error("Remote file too large");
    return new TextDecoder().decode(buf);
  } finally {
    clearTimeout(timer);
  }
}
