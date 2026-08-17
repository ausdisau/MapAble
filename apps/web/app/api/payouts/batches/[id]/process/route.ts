import { z } from "zod";

import { requireApiAdminScope } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  approvePayoutBatch,
  createPayoutBatchFromReadySplits,
  processPayoutBatch,
} from "@/lib/payouts/batch-service";

const processSchema = z.object({
  action: z.enum(["approve", "process"]),
  splitIds: z.array(z.string()).min(1),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiAdminScope("admin:billing:read");
  if (user instanceof Response) return user;
  const { id: batchId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = processSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (parsed.data.action === "approve") {
    const batch = await approvePayoutBatch(batchId, user.id);
    return jsonOk({ batch });
  }

  const result = await processPayoutBatch(batchId, parsed.data.splitIds);
  return jsonOk(result);
}

export async function PUT(
  req: Request,
  _ctx: { params: Promise<{ id: string }> }
) {
  const user = await requireApiAdminScope("admin:billing:read");
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  const splitIds = z.array(z.string()).parse(body?.splitIds ?? []);
  const batch = await createPayoutBatchFromReadySplits(splitIds);
  return jsonOk({ batch });
}
