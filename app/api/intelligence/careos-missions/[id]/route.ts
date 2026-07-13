import { NextResponse } from "next/server";

import { getMapAbleIntelligenceConfig } from "@/intelligence/config";
import { getCareOSMissionDetail } from "@/intelligence/operations/mission-detail-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { isAdminRole } from "@/lib/auth/roles";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const config = getMapAbleIntelligenceConfig();
  if (!config.careOSPersistenceEnabled) {
    return NextResponse.json(
      { error: "CareOS mission history is disabled." },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const canReviewAny =
    user.primaryRole === "support_coordinator" || isAdminRole(user.primaryRole);
  const mission = await getCareOSMissionDetail({
    missionId: id,
    participantId: canReviewAny ? undefined : user.id,
  });
  if (!mission) {
    return NextResponse.json({ error: "Mission not found." }, { status: 404 });
  }
  return NextResponse.json({ mission });
}
