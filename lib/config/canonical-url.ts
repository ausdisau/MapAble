/**
 * Single canonical public origin for metadata, robots, sitemap, and auth links.
 * Controlled-pilot decision: apex https://mapable.com.au only.
 */

export const CANONICAL_PRODUCTION_ORIGIN = "https://mapable.com.au";

const LOCAL_HOST_RE = /^(localhost|127\.0\.0\.1|\[::1\])$/i;

export type CanonicalUrlIssue = {
  variable: string;
  message: string;
};

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

export function isLocalHostname(hostname: string): boolean {
  return LOCAL_HOST_RE.test(hostname);
}

/**
 * Normalize an origin-only URL: accept a single trailing slash, return without it.
 * Returns null when the value is not a parseable absolute URL.
 */
export function normalizeOriginOnlyUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return stripTrailingSlash(
      parsed.origin + (parsed.pathname === "/" ? "" : parsed.pathname),
    );
  } catch {
    return null;
  }
}

/**
 * Validate a public app/auth URL for production use.
 *
 * Production accepts exactly the canonical apex origin (optional trailing `/`).
 * Rejects alternate hosts (including www), non-default ports, paths, query,
 * fragments, credentials, HTTP, and localhost/loopback.
 */
export function validatePublicOriginUrl(
  value: string | undefined,
  variable: string,
  options: { requireCanonicalHost?: boolean } = {},
): CanonicalUrlIssue | null {
  const requireCanonicalHost = options.requireCanonicalHost ?? true;
  const trimmed = value?.trim();
  if (!trimmed) {
    return { variable, message: "Required in production" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { variable, message: "Must be a valid absolute URL" };
  }

  if (parsed.protocol !== "https:") {
    return {
      variable,
      message: "Must use https:// in production (insecure HTTP rejected)",
    };
  }

  if (isLocalHostname(parsed.hostname)) {
    return {
      variable,
      message: "Must not use localhost or loopback in production",
    };
  }

  if (parsed.username || parsed.password) {
    return {
      variable,
      message: "Must not embed credentials in the URL",
    };
  }

  if (parsed.search || parsed.hash) {
    return {
      variable,
      message: "Must be origin-only (no query string or fragment)",
    };
  }

  if (parsed.pathname && parsed.pathname !== "/") {
    return {
      variable,
      message: "Must be origin-only (path other than / rejected)",
    };
  }

  // Non-default ports are rejected (URL.port is "" for default 443).
  if (parsed.port) {
    return {
      variable,
      message: "Must not include a non-default port",
    };
  }

  if (parsed.hostname.toLowerCase() === "www.mapable.com.au") {
    return {
      variable,
      message:
        "Must use apex https://mapable.com.au (www is not the canonical origin)",
    };
  }

  if (
    requireCanonicalHost &&
    parsed.origin.replace(/\/$/, "") !== CANONICAL_PRODUCTION_ORIGIN
  ) {
    return {
      variable,
      message: `Must be exactly ${CANONICAL_PRODUCTION_ORIGIN}`,
    };
  }

  return null;
}

/**
 * Resolve the canonical public origin.
 * Prefers NEXT_PUBLIC_APP_URL, then NEXTAUTH_URL, then the provisional apex default.
 * Never returns localhost when NODE_ENV=production.
 */
export function getCanonicalPublicOrigin(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const candidates = [
    env.NEXT_PUBLIC_APP_URL?.trim(),
    env.NEXTAUTH_URL?.trim(),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate);
      if (env.NODE_ENV === "production") {
        if (parsed.protocol !== "https:" || isLocalHostname(parsed.hostname)) {
          continue;
        }
        // Prefer exact apex when building production metadata.
        if (
          parsed.hostname.toLowerCase() === "www.mapable.com.au" ||
          parsed.port ||
          (parsed.pathname && parsed.pathname !== "/") ||
          parsed.search ||
          parsed.hash
        ) {
          continue;
        }
      }
      return stripTrailingSlash(parsed.origin);
    } catch {
      continue;
    }
  }

  if (env.NODE_ENV === "production") {
    return CANONICAL_PRODUCTION_ORIGIN;
  }

  return "http://localhost:3000";
}

export function validateProductionPublicUrls(
  env: NodeJS.ProcessEnv = process.env,
): CanonicalUrlIssue[] {
  if (env.NODE_ENV !== "production") return [];

  const issues: CanonicalUrlIssue[] = [];

  const nextAuthUrl = env.NEXTAUTH_URL?.trim();
  const publicAppUrl = env.NEXT_PUBLIC_APP_URL?.trim();

  if (!nextAuthUrl && !publicAppUrl) {
    issues.push({
      variable: "NEXTAUTH_URL",
      message:
        "NEXTAUTH_URL or NEXT_PUBLIC_APP_URL required in production (canonical https origin)",
    });
    issues.push({
      variable: "NEXT_PUBLIC_APP_URL",
      message:
        "NEXTAUTH_URL or NEXT_PUBLIC_APP_URL required in production (canonical https origin)",
    });
    return issues;
  }

  if (nextAuthUrl) {
    const issue = validatePublicOriginUrl(nextAuthUrl, "NEXTAUTH_URL");
    if (issue) issues.push(issue);
  }

  if (publicAppUrl) {
    const issue = validatePublicOriginUrl(publicAppUrl, "NEXT_PUBLIC_APP_URL");
    if (issue) issues.push(issue);
  }

  if (nextAuthUrl && publicAppUrl) {
    try {
      const a = stripTrailingSlash(new URL(nextAuthUrl).origin);
      const b = stripTrailingSlash(new URL(publicAppUrl).origin);
      if (a !== b) {
        issues.push({
          variable: "NEXTAUTH_URL",
          message: "Must match NEXT_PUBLIC_APP_URL origin in production",
        });
      }
    } catch {
      // Invalid URL issues already recorded above.
    }
  }

  return issues;
}

export function validateProductionDatabaseUrls(
  env: NodeJS.ProcessEnv = process.env,
): CanonicalUrlIssue[] {
  if (env.NODE_ENV !== "production") return [];

  const issues: CanonicalUrlIssue[] = [];

  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    issues.push({
      variable: "DATABASE_URL",
      message: "Required in production",
    });
  } else {
    try {
      const parsed = new URL(databaseUrl);
      if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
        issues.push({
          variable: "DATABASE_URL",
          message: "Must be a postgresql:// URL",
        });
      }
      if (isLocalHostname(parsed.hostname) && env.VERCEL === "1") {
        issues.push({
          variable: "DATABASE_URL",
          message: "Must not point at localhost on Vercel production",
        });
      }
    } catch {
      issues.push({
        variable: "DATABASE_URL",
        message: "Must be a valid database URL",
      });
    }
  }

  const directUrl = env.DIRECT_URL?.trim();
  if (!directUrl) {
    issues.push({
      variable: "DIRECT_URL",
      message: "Required in production (direct migration connection)",
    });
  } else {
    try {
      const parsed = new URL(directUrl);
      if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
        issues.push({
          variable: "DIRECT_URL",
          message: "Must be a postgresql:// URL",
        });
      }
      if (isLocalHostname(parsed.hostname) && env.VERCEL === "1") {
        issues.push({
          variable: "DIRECT_URL",
          message: "Must not point at localhost on Vercel production",
        });
      }
    } catch {
      issues.push({
        variable: "DIRECT_URL",
        message: "Must be a valid database URL",
      });
    }
  }

  return issues;
}

/**
 * Canonical auth-signing secret contract for production gates:
 * - Production (Vercel production or MAPABLE_ENFORCE_PRODUCTION_ENV): require
 *   `NEXTAUTH_SECRET` (≥16 chars). Aliases are not accepted at the deploy gate.
 * - Vercel preview: `NEXTAUTH_SECRET` or `MAPABLE_PREVIEW_AUTH_SECRET` (≥16).
 * - Runtime NextAuth resolution may still accept AUTH_SECRET / SESSION_SECRET
 *   as legacy signing aliases only — never for data encryption.
 */
export function validateProductionNextAuthSecret(
  env: NodeJS.ProcessEnv = process.env,
): CanonicalUrlIssue[] {
  if (env.NODE_ENV !== "production") return [];

  const secret = env.NEXTAUTH_SECRET?.trim();
  const previewSecret = env.MAPABLE_PREVIEW_AUTH_SECRET?.trim();
  const isPreview =
    env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "development";

  if (!secret && !(isPreview && previewSecret)) {
    return [
      {
        variable: "NEXTAUTH_SECRET",
        message:
          "Required in production (min 16 characters). Deploy gate does not accept AUTH_SECRET/SESSION_SECRET aliases.",
      },
    ];
  }

  const effective = secret || previewSecret || "";
  if (effective.length < 16) {
    return [
      {
        variable: "NEXTAUTH_SECRET",
        message: "Must be at least 16 characters",
      },
    ];
  }

  return [];
}
