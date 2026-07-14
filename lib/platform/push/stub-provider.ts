import { mobileCommunicationConfig } from "@/lib/config/mobile-communication";
import type {
  PushPermissionStatus,
  PushProvider,
  PushSubscriptionRecord,
} from "@/lib/platform/push/push-contracts";

/** Stub push provider — real Web Push wiring deferred to native client. */
export class StubPushProvider implements PushProvider {
  readonly name = "stub";

  async getPermissionStatus(): Promise<PushPermissionStatus> {
    if (!mobileCommunicationConfig.mobilePushEnabled) return "unsupported";
    return "default";
  }

  async requestPermission(): Promise<PushPermissionStatus> {
    if (!mobileCommunicationConfig.mobilePushEnabled) return "unsupported";
    return "denied";
  }

  async subscribe(_userId: string): Promise<PushSubscriptionRecord | null> {
    if (!mobileCommunicationConfig.mobilePushEnabled) return null;
    return null;
  }

  async unsubscribe(_endpoint: string): Promise<void> {
    // no-op stub
  }
}

export function createPushProvider(): PushProvider {
  return new StubPushProvider();
}
