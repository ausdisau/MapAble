import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import {
  assertRecipientAccess,
  plainLanguageOnboardingStatus,
  syncRecipientFromStripeAccount,
} from "@/lib/payouts/recipient-service";
import { getStripeClient } from "@/lib/stripe/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;

  const access = await assertRecipientAccess(id, user.id, isAdminRole(user.primaryRole));
  if (!access.ok) return jsonError(access.error, 403);

  let recipient = access.recipient;
  if (recipient.stripeAccountId) {
    try {
      const stripe = getStripeClient();
      const account = await stripe.accounts.retrieve(recipient.stripeAccountId);
      const synced = await syncRecipientFromStripeAccount(
        recipient.stripeAccountId,
        account
      );
      if (synced) recipient = synced;
    } catch {
      // Return cached status if Stripe unavailable
    }
  }

  const status = plainLanguageOnboardingStatus(
    recipient.stripeOnboardingStatus,
    recipient.transfersEnabled,
    recipient.payoutsEnabled
  );

  return jsonOk({ recipient, status });
}
