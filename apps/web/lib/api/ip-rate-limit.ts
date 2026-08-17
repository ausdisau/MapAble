/**
 * Process-local IP rate limit. NOT production-safe for multi-instance
 * deployments — each instance has its own Map. Do not cite this as
 * distributed rate limiting. Sensitive production capabilities must remain
 * disabled until a shared store (e.g. Redis/Upstash) is configured and verified.
 * See docs/operations/RATE_LIMITING.md.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}

/** @returns true when the request is allowed; false when limited. */
export function checkIpRateLimit(
  ip: string,
  options: { windowMs: number; max: number },
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + options.windowMs });
    return true;
  }
  if (entry.count >= options.max) return false;
  entry.count += 1;
  return true;
}
