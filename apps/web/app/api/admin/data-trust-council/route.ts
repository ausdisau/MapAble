import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  listCouncilRecords,
  scheduleCouncilMeeting,
} from "@/lib/governance/data-trust-council/council-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ records: await listCouncilRecords() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const record = await scheduleCouncilMeeting({
    title: body.title,
    summary: body.summary,
    meetingAt: body.meetingAt ? new Date(body.meetingAt) : undefined,
  });
  return jsonOk({ record }, 201);
}
