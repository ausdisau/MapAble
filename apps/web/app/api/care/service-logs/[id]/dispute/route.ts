import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { disputeCareServiceLog } from "@/lib/care/care-service-log-service";
import { disputeCareServiceLogSchema } from "@/lib/validation/care";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  const { id } = await params;
  try {
    const parsed = disputeCareServiceLogSchema.parse(await req.json());
    const log = await disputeCareServiceLog(id, user, parsed.disputeReason);
    return jsonOk({ log });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not dispute", 400);
  }
}
