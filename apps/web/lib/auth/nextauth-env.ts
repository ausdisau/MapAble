const DEV_FALLBACK_SECRET =
  "mapable-dev-only-nextauth-secret-not-for-production";

const MIN_SECRET_LENGTH = 16;

/** Ensure NextAuth env is usable on Vercel before the route handler loads. */
export function ensureNextAuthEnv(): void {
  if (!process.env.NEXTAUTH_URL?.trim()) {
    const fromPublic = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const fromVercel =
      process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
      process.env.VERCEL_URL?.trim();

    if (fromPublic) {
      process.env.NEXTAUTH_URL = fromPublic.replace(/\/$/, "");
    } else if (fromVercel) {
      process.env.NEXTAUTH_URL = `https://${fromVercel.replace(/^https?:\/\//, "")}`;
    }
  }
}

export function isVercelProductionDeployment(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV === "production"
  );
}

export function isVercelPreviewDeployment(): boolean {
  return process.env.VERCEL_ENV === "preview";
}

function configuredSecretCandidates(): string[] {
  return [
    process.env.NEXTAUTH_SECRET?.trim(),
    process.env.SESSION_SECRET?.trim(),
    process.env.AUTH_SECRET?.trim(),
    process.env.MAPABLE_PREVIEW_AUTH_SECRET?.trim(),
  ].filter((value): value is string => Boolean(value));
}

function firstValidSecret(candidates: string[]): string | undefined {
  return candidates.find((secret) => secret.length >= MIN_SECRET_LENGTH);
}

/**
 * Resolves the NextAuth JWT signing secret.
 *
 * Policy (option C — hybrid):
 * - Vercel production: fail closed unless NEXTAUTH_SECRET (or alias) is configured.
 * - Vercel preview: fail closed unless a platform-injected preview secret is set
 *   (`NEXTAUTH_SECRET` or `MAPABLE_PREVIEW_AUTH_SECRET` in the Preview env group).
 * - Local development / tests: dev-only fallback so auth endpoints stay usable.
 */
export function resolveNextAuthSecret(): string | undefined {
  ensureNextAuthEnv();

  const configured = firstValidSecret(configuredSecretCandidates());
  if (configured) {
    return configured;
  }

  if (isVercelProductionDeployment()) {
    console.error(
      "[auth] CRITICAL: NEXTAUTH_SECRET is missing or shorter than 16 characters on Vercel production. Auth is disabled until configured.",
    );
    return undefined;
  }

  if (isVercelPreviewDeployment()) {
    console.error(
      "[auth] NEXTAUTH_SECRET or MAPABLE_PREVIEW_AUTH_SECRET is missing or too short on Vercel preview. Set a Preview-scoped secret in Vercel — do not rely on repo fallbacks.",
    );
    return undefined;
  }

  if (process.env.NODE_ENV === "production") {
    console.error(
      "[auth] CRITICAL: NEXTAUTH_SECRET is missing or shorter than 16 characters in production. Auth is disabled until configured.",
    );
    return undefined;
  }

  console.warn(
    "[auth] NEXTAUTH_SECRET is not set; using dev-only fallback for local JWT signing",
  );
  return DEV_FALLBACK_SECRET;
}
