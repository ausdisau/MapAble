import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isResponse } from "@/lib/billing/api-helpers";
import {
  createDraftInvoice,
  listInvoicesForUser,
} from "@/lib/billing/core/invoice-service";
import { createInvoiceSchema } from "@/lib/billing/core/schemas";
import { isUnsafeMarketplaceInvoice } from "@/packages/marketplace-inclusive/src/index";

export async function GET() {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  const invoices = await listInvoicesForUser(user.id);
  return jsonOk({ invoices });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  const body = await req.json();
  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  // Block the old client-priced Marketplace invoice path independently of the alpha flag.
  if (isUnsafeMarketplaceInvoice(parsed.data)) {
    return jsonError("Marketplace checkout remains disabled pending financial and safety approval.", 409);
  }
  const invoice = await createDraftInvoice(user.id, parsed.data);
  return jsonOk({ invoice }, 201);
}
