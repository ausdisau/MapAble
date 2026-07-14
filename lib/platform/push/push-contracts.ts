export type PushChannel = "booking_reminder" | "mission_update" | "message" | "sync_complete";

export type PushPermissionStatus = "granted" | "denied" | "default" | "unsupported";

export interface PushPreference {
  channel: PushChannel;
  enabled: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
  createdAt: string;
}

export interface PushProvider {
  readonly name: string;
  getPermissionStatus(): Promise<PushPermissionStatus>;
  requestPermission(): Promise<PushPermissionStatus>;
  subscribe(userId: string): Promise<PushSubscriptionRecord | null>;
  unsubscribe(endpoint: string): Promise<void>;
  sendTestNotification?(userId: string): Promise<void>;
}

export const DEFAULT_PUSH_PREFERENCES: PushPreference[] = [
  { channel: "booking_reminder", enabled: true },
  { channel: "mission_update", enabled: true },
  { channel: "message", enabled: true },
  { channel: "sync_complete", enabled: false },
];

export function mergePushPreferences(
  stored: PushPreference[] | null | undefined,
): PushPreference[] {
  const byChannel = new Map(
    (stored ?? []).map((pref) => [pref.channel, pref]),
  );
  return DEFAULT_PUSH_PREFERENCES.map(
    (defaultPref) => byChannel.get(defaultPref.channel) ?? defaultPref,
  );
}
