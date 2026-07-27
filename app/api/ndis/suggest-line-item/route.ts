import { requireApiSession } from "@/lib/api/auth-handler";
import {
  isResponse,
  jsonError,
  jsonOk,
  zodErrorResponse,
} from "@/lib/api/response";
import { suggestLineItemForSource } from "@/lib/ndis/ndis-suggestion-service";
import { suggestLineItemSchema } from "@/lib/ndis/schemas";
import {
  assertCanAccessSuggestionSource,
  SuggestionSourceAccessError,
} from "@/lib/ndis/suggestion-source-access";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  const parsed = suggestLineItemSchema.safeParse(
    await req.json().catch(() => ({}))
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await assertCanAccessSuggestionSource(
      user,
      parsed.data.sourceType,
      parsed.data.sourceId
    );
  } catch (e) {
    if (e instanceof SuggestionSourceAccessError) {
      if (e.code === "NOT_FOUND") return jsonError(e.message, 404);
      if (e.code === "UNSUPPORTED") return jsonError(e.message, 400);
      return jsonError(e.message, 403);
    }
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    throw e;
  }

  const result = await suggestLineItemForSource(
    parsed.data.sourceType,
    parsed.data.sourceId,
    parsed.data.hints
  );
  return jsonOk({
    ...result,
    disclaimer:
      "Suggestion requires human review. Not NDIS approved or a claim guarantee.",
  });
}
