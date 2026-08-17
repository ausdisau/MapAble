import { NextResponse } from "next/server";

import { normalizeAuthEmail } from "@/lib/auth/auth-flow";
import { startPasskeyAuthentication } from "@/lib/auth/passkeys";

type PasskeyLoginOptionsBody = {
  email?: string;
};

export async function POST(request: Request) {
  let body: PasskeyLoginOptionsBody;
  try {
    body = (await request.json()) as PasskeyLoginOptionsBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const result = await startPasskeyAuthentication(
      normalizeAuthEmail(body.email),
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not start passkey login",
      },
      { status: 400 },
    );
  }
}
