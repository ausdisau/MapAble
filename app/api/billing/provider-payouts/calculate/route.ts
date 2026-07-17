import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  BillingAccessError,
  assertCanManageBillingOrganisation,
} from "@/lib/billing/access";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { calculateProviderPayables } from "@/lib/billing/payouts/service";
import { calculatePayoutsSchema } from "@/lib/billing/schemas";

export async function POST(req: Request) {
  const user = await requireBillingPermission("billing:manage_payouts");
  if (isResponse(user)) return user;

  const body = await req.json().catch(() => ({}));
  const parsed = calculatePayoutsSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await assertCanManageBillingOrganisation(
      user,
      parsed.data.organisationId
    );
    const payout = await calculateProviderPayables({
      organisationId: parsed.data.organisationId,
      periodStart: new Date(parsed.data.periodStart),
      periodEnd: new Date(parsed.data.periodEnd),
      commissionBps: parsed.data.commissionBps,
      allowUnpaidOrDisputed: parsed.data.allowUnpaidOrDisputed,
      actorId: user.id,
      actorRole: user.primaryRole,
    });
    return jsonOk({ payout }, 201);
  } catch (e) {
    if (e instanceof BillingAccessError) {
      return jsonError(e.message, e.status);
    }
    return jsonError(
      e instanceof Error ? e.message : "Calculate payouts failed",
      400
    );
  }
}
