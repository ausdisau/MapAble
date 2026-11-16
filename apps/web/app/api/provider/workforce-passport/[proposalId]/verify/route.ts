import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { verifyCompetencyProposal } from "@/lib/careos/opportunities/workforce-passport-adapter";
import { prisma } from "@/lib/prisma";
import {
  assertAssessorForWorker,
  loadWorkerOrThrow,
} from "@/lib/workforce/access";
import { handleCapabilityError } from "@/lib/workforce/http";

const Body = z.object({
  approve: z.boolean().optional(),
  decision: z
    .enum(["hold", "request_evidence", "refer_for_assessment", "escalate"])
    .optional(),
  rejectionReason: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ proposalId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { proposalId } = await context.params;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REVIEW" }, { status: 400 });
  }

  try {
    const existing = await prisma.academyCompetencyProposal.findUnique({
      where: { id: proposalId },
    });
    if (!existing) {
      return NextResponse.json({ error: "PROPOSAL_NOT_FOUND" }, { status: 404 });
    }
    const worker = await loadWorkerOrThrow(existing.workerProfileId);
    await assertAssessorForWorker(user, worker);

    const proposal = await verifyCompetencyProposal({
      proposalId,
      verifiedByUserId: user.id,
      approve: parsed.data.approve !== false && !parsed.data.decision,
      decision: parsed.data.decision,
      rejectionReason: parsed.data.rejectionReason,
    });
    return NextResponse.json({ proposal, autoVerified: false });
  } catch (error) {
    return handleCapabilityError(error);
  }
}
