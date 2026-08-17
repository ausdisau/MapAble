/**
 * MapAble Navigator governed pilot flags.
 * All flags default false (fail closed). Enable only with explicit `=== "true"`.
 */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const NAVIGATOR_PILOT_FLAG = "MAPABLE_NAVIGATOR_PILOT_ENABLED";

export const navigatorPilotConfig = {
  /** Master switch for the governed Navigator pilot surface. */
  get enabled(): boolean {
    return envFlag(NAVIGATOR_PILOT_FLAG, false);
  },
  /** Allow model-backed interpret/reply capabilities when pilot is on. */
  get modelAssistedEnabled(): boolean {
    return (
      this.enabled && envFlag("MAPABLE_NAVIGATOR_PILOT_MODEL_ASSISTED", false)
    );
  },
  /** Allow draft-only action envelopes (never book/pay). */
  get envelopesEnabled(): boolean {
    return this.enabled && envFlag("MAPABLE_NAVIGATOR_PILOT_ENVELOPES", false);
  },
  /** Decision Passport projection surface. */
  get passportEnabled(): boolean {
    return this.enabled && envFlag("MAPABLE_NAVIGATOR_PILOT_PASSPORT", false);
  },
  /** Approved-category governed memory only. */
  get memoryEnabled(): boolean {
    return this.enabled && envFlag("MAPABLE_NAVIGATOR_PILOT_MEMORY", false);
  },
  /** Deterministic matching / shortlist. */
  get matchingEnabled(): boolean {
    return this.enabled && envFlag("MAPABLE_NAVIGATOR_PILOT_MATCHING", false);
  },
};

export function isNavigatorPilotEnabled(): boolean {
  return navigatorPilotConfig.enabled;
}

export function isNavigatorEnvelopesEnabled(): boolean {
  return navigatorPilotConfig.envelopesEnabled;
}

export function isNavigatorPassportEnabled(): boolean {
  return navigatorPilotConfig.passportEnabled;
}

export function isNavigatorMemoryEnabled(): boolean {
  return navigatorPilotConfig.memoryEnabled;
}

export function isNavigatorMatchingEnabled(): boolean {
  return navigatorPilotConfig.matchingEnabled;
}
