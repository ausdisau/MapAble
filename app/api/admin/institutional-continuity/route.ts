import { requireApiAdminScope } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  createContinuityPlan,
  getContinuityDashboard,
} from "@/lib/platform/institutional-continuity/continuity-service";
import { reviewContinuityCheckpoint } from "@/lib/platform/institutional-permanence/permanence-service";

export async function GET() {
  const user = await requireApiAdminScope("accountability:publish");
  if (user instanceof Response) return user;
  return jsonOk(await getContinuityDashboard());
}

export async function POST(req: Request) {
  const user = await requireApiAdminScope("accountability:publish");
  if (user instanceof Response) return user;
  const body = await req.json();

  if (body.action === "review_checkpoint") {
    const checkpoint = await reviewContinuityCheckpoint({
      checkpointId: body.checkpointId,
      actorUserId: user.id,
      completed: body.completed ?? false,
      reviewNotes: body.reviewNotes,
    });
    return jsonOk({ checkpoint });
  }

  const plan = await createContinuityPlan(body.title, body.summary);
  return jsonOk({ plan }, 201);
}
