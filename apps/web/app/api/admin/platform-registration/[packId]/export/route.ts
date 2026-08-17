import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { exportPlatformRegistrationPack } from "@/lib/careos/opportunities/platform-registration-pack";

export async function POST(
  _request: Request,
  context: { params: Promise<{ packId: string }> },
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { packId } = await context.params;

  try {
    const payload = await exportPlatformRegistrationPack({
      packId,
      actorUserId: user.id,
    });
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "EXPORT_FAILED";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
