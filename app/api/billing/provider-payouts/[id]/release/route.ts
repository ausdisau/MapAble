import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  BillingAccessError,
  assertCanManageBillingOrganisation,
} from "@/lib/billing/access";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { releaseProviderPayout } from "@/lib/billing/payouts/service";
import { releasePayoutSchema } from "@/lib/billing/schemas";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireBillingPermission("billing:manage_payouts");
  if (isResponse(user)) return user;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = releasePayoutSchema.safeParse({
    ...body,
    payoutId: id,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const existing = await prisma.billingCentreProviderPayout.findUnique({
      where: { id: parsed.data.payoutId },
    });
    if (!existing) return jsonError("Payout not found", 404);
    await assertCanManageBillingOrganisation(user, existing.organisationId);

    const payout = await releaseProviderPayout({
      payoutId: parsed.data.payoutId,
      actorId: user.id,
      actorRole: user.primaryRole,
      destinationRef: parsed.data.destinationRef,
      reason: parsed.data.reason,
    });
    return jsonOk({
      payout,
      connectLive: payout.connectLive,
      simulated: !payout.connectLive,
    });
  } catch (e) {
    if (e instanceof BillingAccessError) {
      return jsonError(e.message, e.status);
    }
    return jsonError(
      e instanceof Error ? e.message : "Release payout failed",
      400
    );
  }
}
