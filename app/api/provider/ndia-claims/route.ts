import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import {
  createProviderClaimDraft,
  listProviderClaims,
} from "@/lib/ndia-provider-claiming/claim-service";

const createSchema = z
  .object({
    organisationId: z.string().cuid(),
    legacyInvoiceId: z.string().cuid().optional(),
    billingInvoiceId: z.string().cuid().optional(),
  })
  .refine((d) => d.legacyInvoiceId || d.billingInvoiceId, {
    message: "legacyInvoiceId or billingInvoiceId required",
  });

export async function GET(req: Request) {
  const user = await requireApiPermission("provider:ndia:claim");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  let organisationId = url.searchParams.get("organisationId") ?? undefined;
  if (!organisationId && !isAdminRole(user.primaryRole)) {
    const orgIds = await getUserOrganisationIds(user.id);
    organisationId = orgIds[0];
  }
  if (!organisationId) {
    return jsonError("organisationId required", 400);
  }

  const claims = await listProviderClaims(user, organisationId);
  return jsonOk({ claims });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("provider:ndia:claim");
  if (user instanceof Response) return user;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await createProviderClaimDraft({
      user,
      organisationId: parsed.data.organisationId,
      legacyInvoiceId: parsed.data.legacyInvoiceId,
      billingInvoiceId: parsed.data.billingInvoiceId,
    });
    if (!result.ok) return jsonError(result.error ?? "Failed", 400);
    return jsonOk(result, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "NDIA_PROVIDER_CLAIMING_DISABLED") {
      return jsonError("NDIA provider claiming is disabled", 503);
    }
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    throw e;
  }
}
