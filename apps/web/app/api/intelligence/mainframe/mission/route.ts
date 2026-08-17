import { ZodError, z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { SyntheticMainframeError } from "@/lib/intelligence/mainframe/config/synthetic-guard";
import { runSyntheticMainframe } from "@/lib/intelligence/mainframe/orchestrator/mainframe-orchestrator";
import { mainframeContextManifestSchema } from "@/lib/intelligence/mainframe/types/mainframe-context";

const requestSchema = z.object({
  goal: z.string().trim().min(3).max(500),
  context: mainframeContextManifestSchema,
}).strict();

export async function POST(request: Request) {
  const user = await requireApiPermission("admin:agent-runs:read");
  if (user instanceof Response) return user;
  try {
    const input = requestSchema.parse(await request.json());
    return jsonOk({ outcome: runSyntheticMainframe(input) });
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    if (error instanceof SyntheticMainframeError) {
      return jsonError(error.code, 503);
    }
    return jsonError("SYNTHETIC_MAINFRAME_FAILED", 400);
  }
}
