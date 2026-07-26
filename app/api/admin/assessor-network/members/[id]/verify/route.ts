import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError } from "@/lib/api/response";
import { verifyAssessorCredential } from "@/lib/assessor/network/assessor-network-pilot-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  try {
    const member = await verifyAssessorCredential({
      memberId: id,
      actorUserId: user.id,
      approved: body.approved !== false,
    });
    return NextResponse.json({ member });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Verify failed";
    return jsonError(message, 400);
  }
}
