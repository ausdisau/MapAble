import { ensureNextAuthEnv } from "@/lib/auth/nextauth-env";
import { getCanonicalPublicOrigin } from "@/lib/config/canonical-url";

/** Canonical app origin for auth links (password reset, callbacks). */
export function getAppBaseUrl(): string {
  ensureNextAuthEnv();
  return getCanonicalPublicOrigin();
}
