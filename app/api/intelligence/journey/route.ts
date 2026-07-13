import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { journeyPlanRequestSchema } from "@/intelligence/types";
import { planAccessibleJourney } from "@/intelligence/journey-plan-service";
import { requireApiSession } from "@/lib/api/auth-handler";

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const input = journeyPlanRequestSchema.parse(await request.json());
    const plan = await planAccessibleJourney({ user, request: input });
    return NextResponse.json({ plan });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please check the journey details.", issues: error.flatten() },
        { status: 400 }
      );
    }
    console.error("[intelligence-journey]", error);
    return NextResponse.json(
      { error: "MapAble could not prepare the journey right now." },
      { status: 500 }
    );
  }
}
