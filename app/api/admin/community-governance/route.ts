import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  recordGovernanceMeeting,
  recordGovernanceDecision,
} from "@/lib/governance/community/governance-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const meetings = await prisma.communityGovernanceMeeting.findMany({
    orderBy: { meetingAt: "desc" },
    take: 20,
    include: { decisions: true },
  });
  return jsonOk({ meetings });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (body.type === "decision") {
    const decision = await recordGovernanceDecision({
      meetingId: body.meetingId,
      title: body.title,
      summary: body.summary,
      actorUserId: user.id,
    });
    return jsonOk({ decision });
  }
  const meeting = await recordGovernanceMeeting({
    title: body.title,
    meetingAt: new Date(body.meetingAt),
    notes: body.notes,
    actorUserId: user.id,
  });
  return jsonOk({ meeting });
}
