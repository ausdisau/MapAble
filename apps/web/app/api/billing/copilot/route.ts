import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireAnyBillingPermission,
} from "@/lib/billing/api-helpers";
import { generateBillingCopilotSuggestions } from "@/lib/billing/copilot/suggestions";
import { copilotSuggestionsSchema } from "@/lib/billing/schemas";

/**
 * Billing Copilot — suggestions only. No autonomous actions.
 */
export async function POST(req: Request) {
  const user = await requireAnyBillingPermission([
    "billing:view_own",
    "billing:view_all",
    "billing:view_provider",
    "billing:edit_draft",
  ]);
  if (isResponse(user)) return user;

  const body = await req.json().catch(() => ({}));
  const parsed = copilotSuggestionsSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const suggestions = await generateBillingCopilotSuggestions({
      invoiceId: parsed.data.invoiceId,
      serviceRecordId: parsed.data.serviceRecordId,
      paymentId: parsed.data.paymentId,
      matchSessionId: parsed.data.matchSessionId,
    });
    return jsonOk({
      suggestions,
      autonomousActions: false,
      note: "Suggestions only — every item requires human confirmation before use.",
    });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Copilot suggestions failed",
      400
    );
  }
}
