import { ALL_ROLES } from "@/lib/auth/roles";
import type { UserRole } from "@/types/mapable";

export type AccountSessionPresentation =
  | "loading"
  | "signed_in"
  | "signed_out"
  | "unavailable";

export function asUserRole(value: string | undefined | null): UserRole | undefined {
  if (!value) return undefined;
  return ALL_ROLES.includes(value as UserRole)
    ? (value as UserRole)
    : undefined;
}

/**
 * Derive account-control presentation from NextAuth status plus an optional
 * server hint (dashboard shells) and a client probe of `/api/auth/session`.
 *
 * `unavailable` must not be shown as a confirmed sign-out.
 */
export function resolveAccountSessionPresentation(input: {
  status: "loading" | "authenticated" | "unauthenticated";
  hasSessionUser: boolean;
  serverHintName?: string | null;
  sessionProbeFailed?: boolean;
}): AccountSessionPresentation {
  if (input.status === "authenticated" || input.hasSessionUser) {
    return "signed_in";
  }

  // Dashboard layouts already proved auth server-side; avoid a signed-out flash
  // while the client session hydrates.
  if (input.status === "loading" && input.serverHintName?.trim()) {
    return "signed_in";
  }

  if (input.sessionProbeFailed) {
    return "unavailable";
  }

  if (input.status === "loading") {
    return "loading";
  }

  return "signed_out";
}

export function initialsFromDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  const first = parts[0]![0] ?? "";
  const last = parts[parts.length - 1]![0] ?? "";
  return `${first}${last}`.toUpperCase();
}
