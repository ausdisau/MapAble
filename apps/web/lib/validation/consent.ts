import { z } from "zod";

const consentScope = z.enum([
  "profile.read",
  "accessibility.read",
  "booking.read",
  "booking.manage",
  "messages.send",
  "billing.read",
  "support_coordination.access",
  "plan_manager.invoice_access",
  "transport.accessibility_share",
  "transport.trip_access",
  "care.accessibility_share",
  "support_profile.read",
]);

const shareMode = z.enum(["once", "always_for_service", "deny"]);
const recipientType = z.enum([
  "organisation",
  "worker",
  "support_coordinator",
  "plan_manager",
  "platform",
]);

export const grantConsentSchema = z
  .object({
    grantedToUserId: z.string().optional(),
    grantedToOrganisationId: z.string().optional(),
    scope: consentScope,
    purpose: z.string().min(3).max(500),
    expiryDate: z.string().optional(),
    shareMode: shareMode.optional(),
    recipientType: recipientType.optional(),
    dataScope: z.array(z.string()).optional(),
    sourceAction: z.string().max(200).optional(),
  })
  .refine(
    (d) => d.grantedToUserId || d.grantedToOrganisationId,
    "Grant consent to a person or organisation"
  );
