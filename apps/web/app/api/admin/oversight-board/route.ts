import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  getOversightPortalSummary,
  publishOversightDecision,
  scheduleOversightMeeting,
} from "@/lib/governance/oversight-board/oversight-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await getOversightPortalSummary());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (body.title && body.summary && !body.meetingId) {
    const meeting = await scheduleOversightMeeting(body);
    return jsonOk({ meeting }, 201);
  }
  const decision = await publishOversightDecision(body);
  return jsonOk({ decision }, 201);
}
