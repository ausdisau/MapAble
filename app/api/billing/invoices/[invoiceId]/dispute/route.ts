import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { disputeBillingInvoice } from "@/lib/billing/core/transparent-billing";

const schema = z.object({
  reason: z.string().min(10).max(2000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { invoiceId } = await params;

  try {
    const body = schema.parse(await req.json());
    const invoice = await disputeBillingInvoice(
      invoiceId,
      user.id,
      body.reason
    );
    return jsonOk({ invoice });
  } catch (e) {
    if (e instanceof z.ZodError) return zodErrorResponse(e);
    return jsonError("Dispute failed", 400);
  }
}
