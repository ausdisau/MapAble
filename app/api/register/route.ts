import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { normalizeAuthEmail } from "@/lib/auth/auth-flow";
import {
  JURISDICTION_DEFAULTS,
  isMapAbleJurisdiction,
  type MapAbleJurisdiction,
} from "@/lib/nz-schemes";
import { refreshParticipantOnboarding } from "@/lib/onboarding/onboarding-service";
import { prisma } from "@/lib/prisma";
import {
  acceptWorkerInvite,
  getWorkerInviteByToken,
} from "@/lib/workers/worker-invite-service";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
      inviteToken?: string;
      jurisdiction?: string;
    };

    const email = body.email ? normalizeAuthEmail(body.email) : "";
    const password = body.password?.trim() ?? "";
    const name = body.name?.trim() || email.split("@")[0] || "MapAble user";
    const inviteToken = body.inviteToken?.trim();
    const jurisdiction: MapAbleJurisdiction = isMapAbleJurisdiction(
      body.jurisdiction?.trim() ?? "",
    )
      ? (body.jurisdiction!.trim() as MapAbleJurisdiction)
      : "AU";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (inviteToken) {
      const invite = await getWorkerInviteByToken(inviteToken);
      if (!invite || invite.status !== "pending") {
        return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });
      }
      if (email !== invite.email) {
        return NextResponse.json(
          { error: "Email must match the invited address" },
          { status: 400 }
        );
      }
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Sign in instead, or use a different email.",
          code: "EMAIL_ALREADY_REGISTERED",
        },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 10);
    const primaryRole = inviteToken ? "support_worker" : "participant";
    const regionDefaults = JURISDICTION_DEFAULTS[jurisdiction];

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        primaryRole,
      },
    });

    await prisma.userRoleAssignment.upsert({
      where: {
        userId_role: { userId: user.id, role: primaryRole },
      },
      create: {
        userId: user.id,
        role: primaryRole,
        isPrimary: true,
      },
      update: { isPrimary: true },
    });

    if (primaryRole === "participant") {
      await prisma.participantProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          displayName: name,
          jurisdiction,
          timezone: regionDefaults.timezone,
        },
        update: {
          displayName: name,
          jurisdiction,
          timezone: regionDefaults.timezone,
        },
      });
      await refreshParticipantOnboarding(user.id, user.id);
    }

    if (inviteToken) {
      await acceptWorkerInvite({
        token: inviteToken,
        userId: user.id,
        userEmail: email,
      });
    }

    return NextResponse.json({
      id: user.id,
      primaryRole,
      jurisdiction,
    });
  } catch (error) {
    console.error("[register] failed", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
