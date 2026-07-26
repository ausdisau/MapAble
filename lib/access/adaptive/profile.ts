import { adaptiveAccessConfig } from "@/lib/config/adaptive-access";

import type {
  AccessProfileField,
  AccessProfileFieldKey,
  FieldSource,
  ParticipantAccessProfile,
} from "./types";
import { ACCESS_PROFILE_FIELD_KEYS } from "./types";

export class AdaptiveAccessError extends Error {
  constructor(
    message: string,
    readonly statusCode = 400
  ) {
    super(message);
    this.name = "AdaptiveAccessError";
  }
}

export function assertAccessProfileEnabled(): void {
  if (!adaptiveAccessConfig.accessProfileEnabled) {
    throw new AdaptiveAccessError(
      "MAPABLE_ACCESS_PROFILE_ENABLED is false",
      503
    );
  }
}

export function createAccessProfileField<T>(input: {
  key: AccessProfileFieldKey;
  value: T;
  source: FieldSource;
  participantApproved: boolean;
  effectiveAtIso: string;
  expiresAtIso?: string | null;
  disclosureClass?: AccessProfileField["disclosureClass"];
  version?: number;
}): AccessProfileField<T> {
  if (!ACCESS_PROFILE_FIELD_KEYS.includes(input.key)) {
    throw new AdaptiveAccessError(`Unknown access profile field: ${input.key}`);
  }
  return {
    key: input.key,
    value: input.value,
    source: input.source,
    participantApproved: input.participantApproved,
    effectiveAtIso: input.effectiveAtIso,
    expiresAtIso: input.expiresAtIso ?? null,
    disclosureClass: input.disclosureClass ?? "private",
    version: input.version ?? 1,
    correctedAtIso: null,
    revokedAtIso: null,
  };
}

/**
 * Builds an in-memory Access Profile projection.
 * Does not create a new participant identity — references AccessibilityProfile when known.
 */
export function createParticipantAccessProfile(input: {
  participantId: string;
  tenantId: string;
  accessibilityProfileRef?: string | null;
  fields: AccessProfileField[];
  nowIso: string;
}): ParticipantAccessProfile {
  assertAccessProfileEnabled();
  // Last field per key wins (participant corrections override system defaults).
  const byKey = new Map<string, AccessProfileField>();
  for (const field of input.fields) {
    const prior = byKey.get(field.key);
    if (!prior || field.version >= prior.version) {
      byKey.set(field.key, field);
    }
  }
  return {
    participantId: input.participantId,
    tenantId: input.tenantId,
    accessibilityProfileRef: input.accessibilityProfileRef ?? null,
    version: 1,
    fields: [...byKey.values()],
    updatedAtIso: input.nowIso,
  };
}

export function getEffectiveFieldValue<T>(
  profile: ParticipantAccessProfile,
  key: AccessProfileFieldKey,
  nowIso: string
): T | undefined {
  const candidates = profile.fields
    .filter((f) => f.key === key)
    .filter((f) => !f.revokedAtIso)
    .filter(
      (f) => f.participantApproved || f.source === "system_default"
    )
    .filter((f) => !f.expiresAtIso || f.expiresAtIso > nowIso)
    .filter((f) => f.effectiveAtIso <= nowIso)
    .sort((a, b) => b.version - a.version);
  const field = candidates[0];
  if (!field) return undefined;
  return field.value as T;
}

export function revokeAccessProfileField(
  profile: ParticipantAccessProfile,
  key: AccessProfileFieldKey,
  nowIso: string
): ParticipantAccessProfile {
  assertAccessProfileEnabled();
  return {
    ...profile,
    version: profile.version + 1,
    updatedAtIso: nowIso,
    fields: profile.fields.map((f) =>
      f.key === key
        ? { ...f, revokedAtIso: nowIso, version: f.version + 1 }
        : f
    ),
  };
}

export function correctAccessProfileField<T>(
  profile: ParticipantAccessProfile,
  key: AccessProfileFieldKey,
  value: T,
  nowIso: string
): ParticipantAccessProfile {
  assertAccessProfileEnabled();
  const existing = profile.fields.find((f) => f.key === key);
  if (!existing) {
    throw new AdaptiveAccessError(`Field not found: ${key}`, 404);
  }
  const next: AccessProfileField = {
    ...existing,
    value,
    participantApproved: true,
    source: "participant",
    correctedAtIso: nowIso,
    revokedAtIso: null,
    version: existing.version + 1,
    effectiveAtIso: nowIso,
  };
  return {
    ...profile,
    version: profile.version + 1,
    updatedAtIso: nowIso,
    fields: profile.fields.map((f) => (f.key === key ? next : f)),
  };
}

/** Safe defaults — no mandatory full preference configuration before service. */
export function createAssistedOnboardingDefaults(nowIso: string): AccessProfileField[] {
  return [
    createAccessProfileField({
      key: "informationDensity",
      value: "medium",
      source: "system_default",
      participantApproved: true,
      effectiveAtIso: nowIso,
    }),
    createAccessProfileField({
      key: "reducedMotion",
      value: false,
      source: "system_default",
      participantApproved: true,
      effectiveAtIso: nowIso,
    }),
    createAccessProfileField({
      key: "controlSize",
      value: "standard",
      source: "system_default",
      participantApproved: true,
      effectiveAtIso: nowIso,
    }),
    createAccessProfileField({
      key: "changeTolerance",
      value: "standard",
      source: "system_default",
      participantApproved: true,
      effectiveAtIso: nowIso,
    }),
  ];
}
