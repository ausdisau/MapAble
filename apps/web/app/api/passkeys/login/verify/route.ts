import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { NextResponse } from "next/server";

import { finishPasskeyAuthentication } from "@/lib/auth/passkeys";

type PasskeyLoginVerifyBody = {
  challengeToken?: string;
  credential?: AuthenticationResponseJSON;
};

export async function POST(request: Request) {
  let body: PasskeyLoginVerifyBody;
  try {
    body = (await request.json()) as PasskeyLoginVerifyBody;
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
    const result = await finishPasskeyAuthentication({
      challengeToken: body.challengeToken,
      credential: body.credential,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Passkey sign-in failed",
      },
      { status: 401 },
    );
  }
}
