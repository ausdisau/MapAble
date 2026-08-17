import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createPayoutRecipient } from "@/lib/payouts/recipient-service";

const schema = z.object({
  recipientType: z.enum([
    "support_worker",
    "provider_org",
    "transport_operator",
    "mapable_platform",
    "other",
  ]),
  userId: z.string().optional(),
  providerOrgId: z.string().optional(),
  workerId: z.string().optional(),
  email: z.string().email(),
  displayName: z.string().min(1),
  country: z.string().default("AU"),
  dashboardPreference: z.enum(["express"]).default("express"),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const recipient = await createPayoutRecipient(
      { ...parsed.data, userId: parsed.data.userId ?? user.id },
      user.id
    );
    return jsonOk({ recipient });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Failed to create recipient", 500);
  }
}
