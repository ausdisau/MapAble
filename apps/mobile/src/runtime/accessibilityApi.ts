export type CommunicationPreference =
  | 'plain_language'
  | 'sms'
  | 'email'
  | 'phone'
  | 'aac'
  | 'auslan'
  | 'support_person'
  | 'written_only';

export type DigitalPreferences = {
  largeText?: boolean;
  highContrast?: boolean;
  reducedMotion?: boolean;
  screenReaderUser?: boolean;
  voiceControlPreferred?: boolean;
  dyslexiaFriendlyMode?: boolean;
  simpleLanguageMode?: boolean;
  ui?: Record<string, unknown>;
  [key: string]: unknown;
};

export type AccessibilityProfile = {
  mobilityNeeds: string[];
  communicationPreferences: CommunicationPreference[];
  sensoryPreferences: Record<string, unknown>;
  cognitivePreferences: Record<string, unknown>;
  transportRequirements: Record<string, unknown>;
  digitalPreferences: DigitalPreferences;
  shareWithProviders: Record<string, boolean>;
};

export class AccessibilityApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccessibilityApiError';
  }
}

const communicationValues = new Set<CommunicationPreference>([
  'plain_language',
  'sms',
  'email',
  'phone',
  'aac',
  'auslan',
  'support_person',
  'written_only',
]);

function getBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_MAPABLE_API_URL ?? '').trim().replace(/\/+$/, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isBooleanRecord(value: unknown): value is Record<string, boolean> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === 'boolean');
}

function parseProfile(value: unknown): AccessibilityProfile | null {
  if (!isRecord(value)) return null;
  if (!Array.isArray(value.mobilityNeeds) || !value.mobilityNeeds.every((item) => typeof item === 'string')) {
    return null;
  }
  if (
    !Array.isArray(value.communicationPreferences) ||
    !value.communicationPreferences.every(
      (item) => typeof item === 'string' && communicationValues.has(item as CommunicationPreference),
    )
  ) {
    return null;
  }
  if (
    !isRecord(value.sensoryPreferences) ||
    !isRecord(value.cognitivePreferences) ||
    !isRecord(value.transportRequirements) ||
    !isRecord(value.digitalPreferences) ||
    !isBooleanRecord(value.shareWithProviders)
  ) {
    return null;
  }

  return {
    mobilityNeeds: value.mobilityNeeds as string[],
    communicationPreferences: value.communicationPreferences as CommunicationPreference[],
    sensoryPreferences: value.sensoryPreferences,
    cognitivePreferences: value.cognitivePreferences,
    transportRequirements: value.transportRequirements,
    digitalPreferences: value.digitalPreferences as DigitalPreferences,
    shareWithProviders: value.shareWithProviders,
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new AccessibilityApiError('MapAble returned an unreadable accessibility response.');
  }
}

function errorMessage(payload: unknown, fallback: string): string {
  return isRecord(payload) && typeof payload.error === 'string' ? payload.error : fallback;
}

export async function fetchAccessibilityProfile(accessToken: string): Promise<AccessibilityProfile> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) throw new AccessibilityApiError('MapAble platform connection is not configured.');

  const response = await fetch(`${baseUrl}/api/accessibility-profile`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = await readJson(response);
  if (!response.ok) {
    throw new AccessibilityApiError(errorMessage(payload, 'Accessibility profile could not be loaded.'));
  }

  const profile = isRecord(payload) ? parseProfile(payload.profile) : null;
  if (!profile) {
    throw new AccessibilityApiError('MapAble returned an unexpected accessibility profile.');
  }
  return profile;
}

export async function updateCommunicationPreferences(
  accessToken: string,
  communicationPreferences: CommunicationPreference[],
): Promise<AccessibilityProfile> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) throw new AccessibilityApiError('MapAble platform connection is not configured.');
  if (!communicationPreferences.every((value) => communicationValues.has(value))) {
    throw new AccessibilityApiError('One or more communication preferences are not supported.');
  }

  // The general profile PATCH schema has defaults. Fetch-and-merge first so a
  // narrow communication update cannot accidentally reset unrelated access data.
  const current = await fetchAccessibilityProfile(accessToken);
  const response = await fetch(`${baseUrl}/api/accessibility-profile`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...current,
      communicationPreferences: [...new Set(communicationPreferences)],
    }),
  });
  const payload = await readJson(response);
  if (!response.ok) {
    throw new AccessibilityApiError(errorMessage(payload, 'Communication preferences could not be saved.'));
  }

  const profile = isRecord(payload) ? parseProfile(payload.profile) : null;
  if (!profile) {
    throw new AccessibilityApiError('MapAble returned an unexpected accessibility profile.');
  }
  return profile;
}

export async function updateDigitalPreferences(
  accessToken: string,
  patch: Pick<
    DigitalPreferences,
    'largeText' | 'highContrast' | 'reducedMotion' | 'screenReaderUser' | 'voiceControlPreferred' | 'dyslexiaFriendlyMode' | 'simpleLanguageMode'
  >,
): Promise<DigitalPreferences> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) throw new AccessibilityApiError('MapAble platform connection is not configured.');

  const response = await fetch(`${baseUrl}/api/accessibility-profile/digital-preferences`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  });
  const payload = await readJson(response);
  if (!response.ok) {
    throw new AccessibilityApiError(errorMessage(payload, 'Digital access preferences could not be saved.'));
  }

  if (!isRecord(payload) || !isRecord(payload.digitalPreferences)) {
    throw new AccessibilityApiError('MapAble returned unexpected digital access preferences.');
  }
  return payload.digitalPreferences as DigitalPreferences;
}
