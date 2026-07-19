/**
 * Single canonical public origin for metadata, robots, sitemap, and auth links.
 * Provisional Wave 0 decision: apex https://mapable.com.au (www TLS expired; see PR #344).
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
 * Validate a public app/auth URL for production use.
 * Rejects localhost, 127.0.0.1, insecure HTTP, and malformed URLs.
 */
export function validatePublicOriginUrl(
  value: string | undefined,
  variable: string,
): CanonicalUrlIssue | null {
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
      }
      return stripTrailingSlash(candidate);
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

  if (
    nextAuthUrl &&
    publicAppUrl &&
    stripTrailingSlash(nextAuthUrl) !== stripTrailingSlash(publicAppUrl)
  ) {
    issues.push({
      variable: "NEXTAUTH_URL",
      message: "Must match NEXT_PUBLIC_APP_URL origin in production",
    });
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
    issues.push({ variable: "DATABASE_URL", message: "Required in production" });
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
        message: "Required in production (min 16 characters)",
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
