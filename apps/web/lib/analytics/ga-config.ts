/** MapAble Google Analytics 4 measurement ID */
export const GA_MEASUREMENT_ID = "G-3H6VVSQJ0C";

/** Env bag accepted by GA helpers (partial ProcessEnv for tests). */
export type GoogleAnalyticsEnv = {
  NODE_ENV?: string;
  NEXT_PUBLIC_GA_ENABLED?: string;
};

/**
 * GA loads site-wide in production only.
 * Set NEXT_PUBLIC_GA_ENABLED=false to kill the script without a deploy rollback.
 */
export function isGoogleAnalyticsEnabled(
  env: GoogleAnalyticsEnv = process.env,
): boolean {
  if (env.NEXT_PUBLIC_GA_ENABLED === "false") return false;
  // Avoid polluting GA from local/dev unless explicitly forced.
  if (env.NODE_ENV !== "production") return false;
  return true;
}
