import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { suggestMatches } from "@/lib/billing/reconciliation/service";
import { suggestMatchesSchema } from "@/lib/billing/schemas";

export async function POST(req: Request) {
  const user = await requireBillingPermission("billing:reconcile");
  if (isResponse(user)) return user;

  const body = await req.json().catch(() => ({}));
  const parsed = suggestMatchesSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const suggestions = await suggestMatches({
      sessionId: parsed.data.sessionId,
      payments: parsed.data.payments.map((p) => ({
        ...p,
        paidAt: p.paidAt ? new Date(p.paidAt) : null,
      })),
    });
    return jsonOk({ suggestions });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Suggest matches failed",
      400
    );
  }
}
