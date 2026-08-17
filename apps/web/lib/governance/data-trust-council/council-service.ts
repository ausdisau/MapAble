import { phase8Config } from "@/lib/config/phase8";
import { prisma } from "@/lib/prisma";

export async function scheduleCouncilMeeting(params: {
  title: string;
  summary: string;
  meetingAt?: Date;
}) {
  if (!phase8Config.dataTrustCouncilEnabled) {
    throw new Error("DATA_TRUST_COUNCIL_DISABLED");
  }
  return prisma.dataTrustCouncilRecord.create({
    data: {
      title: params.title,
      summary: params.summary,
      meetingAt: params.meetingAt,
      status: "scheduled",
    },
  });
}

export async function listCouncilRecords() {
  return prisma.dataTrustCouncilRecord.findMany({
    orderBy: { meetingAt: "desc" },
    take: 20,
  });
}
