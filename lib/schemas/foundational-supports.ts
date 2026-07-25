import { z } from "zod";

export const FOUNDATIONAL_SUPPORT_CATEGORIES = [
  "PUBLIC_INFRASTRUCTURE",
  "STATE_THERAPY",
  "COMMUNITY_GROUP",
  "PEER_NETWORK",
  "MAINSTREAM_HEALTH",
] as const;

export type FoundationalSupportCategory =
  (typeof FOUNDATIONAL_SUPPORT_CATEGORIES)[number];

export const FoundationalSupportSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(FOUNDATIONAL_SUPPORT_CATEGORIES),
  fundingSource: z.string().min(1),
  costType: z.enum(["FREE", "SUBSIDISED"]),
  location: z.object({
    lat: z.number().finite().gte(-90).lte(90),
    lng: z.number().finite().gte(-180).lte(180),
    address: z.string().min(1),
  }),
  accessibilityFeatures: z.array(z.string()),
});

export type FoundationalSupport = z.infer<typeof FoundationalSupportSchema>;
