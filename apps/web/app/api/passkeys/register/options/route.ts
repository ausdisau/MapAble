import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth/current-user";
import { startPasskeyRegistration } from "@/lib/auth/passkeys";

export async function POST() {
  const user = await requireCurrentUser();
  const result = await startPasskeyRegistration(user.id);

  return NextResponse.json(result);
}
