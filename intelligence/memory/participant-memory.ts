export type ParticipantMemoryPreference = {
  key: string;
  value: string | boolean | number;
  source: "participant" | "authorised_delegate";
  consentScope: string;
  updatedAt: string;
};

/**
 * Memory remains participant-controlled. This first increment deliberately does
 * not infer or persist new preferences from conversation text.
 */
export function selectConsentedMemory(
  preferences: ParticipantMemoryPreference[],
  allowedScopes: ReadonlySet<string>
) {
  return preferences.filter((preference) =>
    allowedScopes.has(preference.consentScope)
  );
}
