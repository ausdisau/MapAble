/**
 * Closed-alpha admission is wholly server-side, independent of the legacy
 * MAPABLE_MARKETPLACE_ENABLED transactional gate.
 * A simulated participant/supporter role never grants actual account authority.
 */
export type AlphaTester = { readonly id: string; readonly primaryRole: string };
export type AlphaGate = {
  readonly enabled: boolean;
  readonly permittedUserIds: ReadonlySet<string>;
};

export function alphaGateFromEnvironment(
  env: Record<string, string | undefined> = process.env,
): AlphaGate {
  return {
    enabled: env.MAPABLE_MARKETPLACE_ALPHA_ENABLED === "true",
    permittedUserIds: new Set(
      (env.MAPABLE_MARKETPLACE_ALPHA_TESTER_IDS ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  };
}

/** No login, no tester allowlist, or no flag: deny. */
export function canAccessMarketplaceAlpha(
  user: AlphaTester | null,
  gate: AlphaGate,
): boolean {
  return Boolean(
    gate.enabled &&
      user &&
      (user.primaryRole === "mapable_admin" || gate.permittedUserIds.has(user.id)),
  );
}
