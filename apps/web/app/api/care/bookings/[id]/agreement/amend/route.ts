import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { amendAccessibleServiceAgreement } from "@/lib/care/care-agreement-service";

const amendSchema = z
  .object({
    reason: z.string().min(4).max(500),
    plainLanguageSummary: z.string().min(8).max(4000).optional(),
  })
  .strict();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = amendSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const agreement = await amendAccessibleServiceAgreement({
      careBookingId: id,
      actor: user,
      reason: parsed.data.reason,
      plainLanguageSummary: parsed.data.plainLanguageSummary,
    });
    return jsonOk({ agreement });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    if (e instanceof Error && e.message === "REASON_REQUIRED") {
      return jsonError("Amendment reason required", 400);
    }
    return jsonError("Forbidden", 403);
  }
}
