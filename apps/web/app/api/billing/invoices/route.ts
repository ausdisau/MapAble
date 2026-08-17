import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isResponse } from "@/lib/billing/api-helpers";
import {
  createDraftInvoice,
  listInvoicesForUser,
} from "@/lib/billing/core/invoice-service";
import { createInvoiceSchema } from "@/lib/billing/core/schemas";

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
  const invoice = await createDraftInvoice(user.id, parsed.data);
  return jsonOk({ invoice }, 201);
}
