import { requireApiAdminScope } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  listPublishedOutcomes,
  publishLongTermOutcome,
  publishOutcomeWave,
} from "@/lib/research/long-term-outcomes/outcomes-service";

export async function GET() {
  const user = await requireApiAdminScope("outcomes:read");
  if (user instanceof Response) return user;
  return jsonOk({ outcomes: await listPublishedOutcomes() });
}

export async function POST(req: Request) {
  const user = await requireApiAdminScope("outcomes:read");
  if (user instanceof Response) return user;
  const body = await req.json();

  if (body.action === "wave") {
    const outcomes = await publishOutcomeWave(body);
    return jsonOk({ outcomes }, 201);
  }

  const outcome = await publishLongTermOutcome(body);
  return jsonOk({ outcome }, 201);
}
