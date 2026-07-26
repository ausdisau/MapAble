import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  createPartnerInvoice,
  ensurePartnerBillingAccount,
  getPartnerBillingDashboard,
} from "@/lib/billing/partner/billing-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await getPartnerBillingDashboard());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (body.accountId && body.periodLabel) {
    const invoice = await createPartnerInvoice(
      body.accountId,
      body.periodLabel,
      body.amountCents ?? 0
    );
    return jsonOk({ invoice }, 201);
  }
  const account = await ensurePartnerBillingAccount(
    body.organisationId,
    body.billingEmail
  );
  return jsonOk({ account }, 201);
}
