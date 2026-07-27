import type { UserRole } from "@/types/mapable";

export type CareOSActorType =
  | "participant"
  | "delegate"
  | "worker"
  | "provider_staff"
  | "administrator";

export type CareOSContext = {
  requestId: string;
  sessionId: string;
  traceId: string;
  actor: {
    userId: string;
    roles: UserRole[];
    permissions: string[];
    actorType: CareOSActorType;
  };
  participant: {
    participantId: string;
    preferredName?: string;
    locale: string;
    timezone: string;
  };
  authority: {
    actingForSelf: boolean;
    delegateId?: string;
    allowedActions: string[];
    expiresAt?: string;
  };
  communication: {
    plainLanguage: boolean;
    easyRead: boolean;
    preferredChannels: string[];
    usesAAC: boolean;
    responseLength: "short" | "standard" | "detailed";
  };
  consent: {
    grantedScopes: string[];
    deniedScopes: string[];
    requestScoped: boolean;
    expiresAt?: string;
  };
  runtime: {
    channel: "web" | "mobile" | "voice" | "aac";
    aiEnabled: boolean;
    writeActionsEnabled: boolean;
  };
};
