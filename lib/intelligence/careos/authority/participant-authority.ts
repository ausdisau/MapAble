import type { CurrentUser } from "@/lib/auth/current-user";

import type { CareOSActorType } from "../context/careos-context";

export function careOSActorTypeForUser(user: CurrentUser): CareOSActorType {
  if (user.primaryRole === "participant") return "participant";
  if (user.primaryRole === "family_member") return "delegate";
  if (user.primaryRole === "support_worker") return "worker";
  if (user.primaryRole === "provider_admin" || user.primaryRole === "transport_operator") {
    return "provider_staff";
  }
  return "administrator";
}

export function participantAuthority(user: CurrentUser, participantId: string) {
  const actingForSelf = user.id === participantId;
  return {
    actingForSelf,
    allowedActions: actingForSelf
      ? ["read_information", "draft_request", "recommend_mission"]
      : [],
  };
}
