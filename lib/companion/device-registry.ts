/**
 * Process-local device enrolment registry for Companion foundation.
 * Production persistence can move to Prisma later without changing the API contract.
 */

export type CompanionDeviceRecord = {
  deviceId: string;
  userId: string;
  platform: "ios" | "android";
  appVersion: string;
  pushToken?: string;
  enrolledAt: string;
  revokedAt?: string;
  revokeReason?: string;
};

const devices = new Map<string, CompanionDeviceRecord>();

export function enrolCompanionDevice(
  record: Omit<CompanionDeviceRecord, "enrolledAt" | "revokedAt" | "revokeReason">,
): CompanionDeviceRecord {
  const existing = devices.get(record.deviceId);
  if (existing && existing.userId !== record.userId) {
    throw new Error("Device enrolled to another user");
  }
  const next: CompanionDeviceRecord = {
    ...record,
    enrolledAt: existing?.enrolledAt ?? new Date().toISOString(),
    revokedAt: undefined,
    revokeReason: undefined,
  };
  devices.set(record.deviceId, next);
  return next;
}

export function revokeCompanionDevice(input: {
  userId: string;
  deviceId: string;
  reason: string;
}): CompanionDeviceRecord | null {
  const existing = devices.get(input.deviceId);
  if (!existing || existing.userId !== input.userId) return null;
  const next = {
    ...existing,
    revokedAt: new Date().toISOString(),
    revokeReason: input.reason,
    pushToken: undefined,
  };
  devices.set(input.deviceId, next);
  return next;
}

export function isCompanionDeviceActive(
  userId: string,
  deviceId: string,
): boolean {
  const d = devices.get(deviceId);
  return Boolean(d && d.userId === userId && !d.revokedAt);
}

export function __resetCompanionDevicesForTests(): void {
  devices.clear();
}
