import { requireApiSession } from "@/lib/api/auth-handler";
import {
  guardCapabilityPassportPreview,
  handleCapabilityError,
  jsonPrivate,
} from "@/lib/workforce/http";
import { listDefaultRequirements } from "@/lib/workforce/passport-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const gated = guardCapabilityPassportPreview();
  if (gated) return gated;
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;
  try {
    return jsonPrivate(await listDefaultRequirements());
  } catch (error) {
    return handleCapabilityError(error);
  }
}
