import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth/current-user";
import { finishPasskeyRegistration } from "@/lib/auth/passkeys";

type PasskeyRegistrationVerifyBody = {
  challengeToken?: string;
  credential?: RegistrationResponseJSON;
};

export async function POST(request: Request) {
  await requireCurrentUser();

  let body: PasskeyRegistrationVerifyBody;
  try {
    body = (await request.json()) as PasskeyRegistrationVerifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.challengeToken || !body.credential) {
    return NextResponse.json(
      { error: "Challenge token and credential are required" },
      { status: 400 },
    );
  }

  try {
    await finishPasskeyRegistration({
      challengeToken: body.challengeToken,
      credential: body.credential,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Passkey setup failed",
      },
      { status: 400 },
    );
  }
}
