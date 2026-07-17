import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  OrganisationAccessError,
  assertOrganisationAccess,
} from "@/lib/api/phase3-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createTransportQuote } from "@/lib/transport/quotes/quote-service";

const createSchema = z
  .object({
    organisationId: z.string().min(1),
    participantUserId: z.string().min(1),
    tripRequestId: z.string().min(1).optional(),
    providerLabel: z.string().min(1).max(200),
    components: z
      .array(
        z.object({
          code: z.string().min(1),
          label: z.string().min(1),
          amountCents: z.number().int().nonnegative(),
        }),
      )
      .min(1),
    vehicleAssumptions: z.array(z.string()).optional(),
    accessibilityAssumptions: z.array(z.string()).optional(),
    exclusions: z.array(z.string()).optional(),
    ttlMinutes: z.number().int().optional(),
  })
  .strict();

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await assertOrganisationAccess(
      user,
      parsed.data.organisationId,
      "transport:manage:org",
    );
    const quote = createTransportQuote(parsed.data);
    return jsonOk({ quote }, 201);
  } catch (e) {
    if (e instanceof OrganisationAccessError) {
      return jsonError("Forbidden", 403);
    }
    throw e;
  }
}
