import { z } from "zod";

export const organisationSchema = z.object({
  name: z.string().min(1).max(200),
  abn: z.string().max(20).optional().nullable(),
  organisationType: z.enum([
    "care_provider",
    "transport_provider",
    "plan_manager",
    "support_coordination",
    "employer",
    "community_partner",
    "mapable_internal",
  ]),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().max(30).optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  address: z.string().max(500).optional().nullable(),
  serviceRegions: z.array(z.string()).default([]),
  status: z.enum(["active", "inactive", "archived"]).optional(),
  verificationStatus: z
    .enum([
      "not_started",
      "pending_review",
      "verified",
      "rejected",
      "suspended",
    ])
    .optional(),
  ndisRegistrationClaimed: z.boolean().optional(),
  ndisRegistrationNumber: z.string().max(30).optional().nullable(),
  insuranceStatus: z.string().max(200).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});
