import { NextResponse } from "next/server";

import { checkTwilioSmsVerification } from "@/lib/auth/twilio-verify";
import {
  createTwoFactorToken,
  verifyTwoFactorToken,
} from "@/lib/auth/two-factor-token";
import { prisma } from "@/lib/prisma";

type VerifyTwoFactorBody = {
  challengeToken?: string;
  code?: string;
};

export async function POST(request: Request) {
  let body: VerifyTwoFactorBody;
  try {
    body = (await request.json()) as VerifyTwoFactorBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.challengeToken || !body.code?.trim()) {
    return NextResponse.json(
      { error: "Challenge token and code are required" },
      { status: 400 },
    );
  }

  const challenge = verifyTwoFactorToken(
    body.challengeToken,
    "twilio-2fa-challenge",
  );
  if (!challenge) {
    return NextResponse.json(
      { error: "Two-factor challenge expired. Please sign in again." },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: challenge.userId },
    select: { id: true, phone: true },
  });
  if (!user?.phone?.trim()) {
    return NextResponse.json(
      { error: "Two-factor phone number is missing." },
      { status: 400 },
    );
  }

  const approved = await checkTwilioSmsVerification({
    code: body.code.trim(),
    phone: user.phone,
  });
  if (!approved) {
    return NextResponse.json(
      { error: "Invalid verification code" },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    twoFactorToken: createTwoFactorToken({
      purpose: "credentials-2fa",
      ttlSeconds: 2 * 60,
      userId: user.id,
    }),
  });
}
