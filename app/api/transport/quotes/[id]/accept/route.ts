import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { acceptTransportQuote } from "@/lib/transport/quotes/quote-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  try {
    const quote = acceptTransportQuote({
      quoteId: id,
      participantUserId: user.id,
    });
    return jsonOk({ quote });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    if (e instanceof Error && e.message === "EXPIRED") {
      return jsonError("Quote expired", 410);
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("Forbidden", 403);
    }
    return jsonError("Invalid quote state", 400);
  }
}
