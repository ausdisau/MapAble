import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { listAssessorVerificationQueue } from "@/lib/assessor/network/assessor-network-pilot-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const members = await listAssessorVerificationQueue();
  return NextResponse.json({ members });
}
