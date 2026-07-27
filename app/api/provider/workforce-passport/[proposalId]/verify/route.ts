import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { verifyCompetencyProposal } from "@/lib/careos/opportunities/workforce-passport-adapter";

export async function POST(
  request: Request,
  context: { params: Promise<{ proposalId: string }> },
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { proposalId } = await context.params;
  const body = (await request.json()) as {
    approve?: boolean;
    rejectionReason?: string;
  };

  try {
    const proposal = await verifyCompetencyProposal({
      proposalId,
      verifiedByUserId: user.id,
      approve: body.approve !== false,
      rejectionReason: body.rejectionReason,
    });
    return NextResponse.json({ proposal, autoVerified: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "VERIFY_FAILED";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
