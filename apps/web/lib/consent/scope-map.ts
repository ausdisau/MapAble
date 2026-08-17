import type { ConsentScope as PrismaConsentScope } from "@prisma/client";

import type { ConsentScope } from "@/types/mapable";

const TO_PRISMA: Record<ConsentScope, PrismaConsentScope> = {
  "profile.read": "profile_read",
  "accessibility.read": "accessibility_read",
  "booking.read": "booking_read",
  "booking.manage": "booking_manage",
  "messages.send": "messages_send",
  "billing.read": "billing_read",
  "support_coordination.access": "support_coordination_access",
  "plan_manager.invoice_access": "plan_manager_invoice_access",
  "transport.accessibility_share": "transport_accessibility_share",
  "transport.trip_access": "transport_trip_access",
  "care.accessibility_share": "care_accessibility_share",
  "support_profile.read": "support_profile_read",
  "engagement.read_delegate": "engagement_read_delegate",
  "engagement.submit_delegate": "engagement_submit_delegate",
};

const FROM_PRISMA: Record<PrismaConsentScope, ConsentScope> = Object.fromEntries(
  Object.entries(TO_PRISMA).map(([k, v]) => [v, k as ConsentScope])
) as Record<PrismaConsentScope, ConsentScope>;

export function consentScopeToPrisma(scope: ConsentScope): PrismaConsentScope {
  return TO_PRISMA[scope];
}

export function consentScopeFromPrisma(
  scope: PrismaConsentScope
): ConsentScope {
  return FROM_PRISMA[scope];
}
