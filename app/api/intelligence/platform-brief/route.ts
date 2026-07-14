import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { platformBriefRequestSchema } from "@/intelligence/core-types";
import { buildPlatformBrief } from "@/intelligence/platform-brief-service";
import { requireApiSession } from "@/lib/api/auth-handler";

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const input = platformBriefRequestSchema.parse(await request.json());
    const brief = await buildPlatformBrief({ user, request: input });
    return NextResponse.json(brief);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "The platform brief request is invalid.", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error("[mapable-platform-brief]", error);
    return NextResponse.json(
      { error: "MapAble could not prepare the platform brief." },
      { status: 500 }
    );
  }
}
