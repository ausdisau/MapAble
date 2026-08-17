import { NextResponse } from "next/server";

import { getMapAbleIntelligenceConfig } from "@/intelligence/config";
import { listCareOSMissions } from "@/intelligence/operations/mission-state-service";
import { requireApiSession } from "@/lib/api/auth-handler";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const config = getMapAbleIntelligenceConfig();
  if (!config.careOSPersistenceEnabled) {
    return NextResponse.json(
      {
        missions: [],
        persistenceEnabled: false,
        message: "CareOS mission history is not enabled in this environment.",
      },
    );
  }

  try {
    const missions = await listCareOSMissions(user.id);
    return NextResponse.json({ missions, persistenceEnabled: true });
  } catch (error) {
    console.error("[careos-missions]", error);
    return NextResponse.json(
      { error: "CareOS mission history could not be loaded." },
      { status: 500 },
    );
  }
}
