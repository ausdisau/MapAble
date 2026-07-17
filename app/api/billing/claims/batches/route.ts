import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { createClaimBatch } from "@/lib/billing/claims/batch-service";
import { createClaimBatchSchema } from "@/lib/billing/schemas";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireBillingPermission("billing:export");
  if (isResponse(user)) return user;

  const url = new URL(req.url);
  const organisationId = url.searchParams.get("organisationId");

  const batches = await prisma.billingClaimBatch.findMany({
    where: organisationId ? { organisationId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true },
  });

  return jsonOk({
    batches: batches.map((b) => ({
      ...b,
      simulated: true,
      simulatedLabel:
        "[SIMULATED] This claims path does not submit to the NDIA.",
    })),
  });
}

export async function POST(req: Request) {
  const user = await requireBillingPermission("billing:export");
  if (isResponse(user)) return user;

  const body = await req.json().catch(() => ({}));
  const parsed = createClaimBatchSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const batch = await createClaimBatch({
      organisationId: parsed.data.organisationId,
      invoiceIds: parsed.data.invoiceIds,
      gateway: parsed.data.gateway,
      actorId: user.id,
      actorRole: user.primaryRole,
      createdById: user.id,
    });
    return jsonOk(
      {
        batch,
        simulated: true,
        simulatedLabel:
          "[SIMULATED] This claims path does not submit to the NDIA.",
      },
      201
    );
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Create claim batch failed",
      400
    );
  }
}
