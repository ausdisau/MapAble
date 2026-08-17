import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { verifyPasswordResetToken } from "@/lib/auth/password-reset-token";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { token?: string; password?: string };
    const token = body.token?.trim() ?? "";
    const password = body.password?.trim() ?? "";

    if (!token || !password) {
      return NextResponse.json(
        { error: "Reset token and new password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const payload = verifyPasswordResetToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.email.toLowerCase() !== payload.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ message: "Password updated. You can sign in now." });
  } catch (error) {
    console.error("[reset-password] failed", error);
    return NextResponse.json(
      { error: "Could not reset password. Please try again." },
      { status: 500 }
    );
  }
}
