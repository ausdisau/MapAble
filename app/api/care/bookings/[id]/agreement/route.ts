import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  acceptAccessibleServiceAgreement,
  getOrCreateAccessibleServiceAgreement,
} from "@/lib/care/care-agreement-service";
import { z } from "zod";

const acceptSchema = z
  .object({
    acknowledgement: z.string().min(8).max(2000),
  })
  .strict();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  try {
    const agreement = await getOrCreateAccessibleServiceAgreement(id, user);
    return jsonOk({ agreement });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    return jsonError("Forbidden", 403);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const agreement = await acceptAccessibleServiceAgreement({
      careBookingId: id,
      actor: user,
      acknowledgement: parsed.data.acknowledgement,
    });
    return jsonOk({ agreement });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    if (e instanceof Error && e.message === "PARTICIPANT_ONLY") {
      return jsonError("Only the participant may accept this agreement", 403);
    }
    if (e instanceof Error && e.message === "ACK_REQUIRED") {
      return jsonError("Acknowledgement required", 400);
    }
    return jsonError("Forbidden", 403);
  }
}
