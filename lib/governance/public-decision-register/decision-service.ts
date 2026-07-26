import { phase9Config } from "@/lib/config/phase9";
import {
  isPublicDecisionRegisterV2Enabled,
  y4CivicPlatformConfig,
} from "@/lib/config/y4-civic-platform";
import { requireRatifiedCharter } from "@/lib/governance/charter/charter-gate-service";
import { prisma } from "@/lib/prisma";

export type PublishDecisionParams = {
  title: string;
  summary: string;
  decisionType: string;
  rationale?: string;
  impactedSystems?: string[];
  charterVersion?: string;
  disputeContact?: string;
};

export async function publishDecisionRecord(params: PublishDecisionParams) {
  if (!isPublicDecisionRegisterV2Enabled()) {
    throw new Error("DECISION_REGISTER_DISABLED");
  }

  const charter = await requireRatifiedCharter();

  return prisma.publicDecisionRecord.create({
    data: {
      title: params.title,
      summary: params.summary,
      decisionType: params.decisionType,
      rationale: params.rationale,
      impactedSystems: params.impactedSystems ?? [],
      charterVersion: params.charterVersion ?? charter?.version,
      disputeContact: params.disputeContact ?? "governance@mapable.example",
      status: "published",
      publishedAt: new Date(),
    },
  });
}

export async function listPublicDecisions(decisionType?: string) {
  if (!isPublicDecisionRegisterV2Enabled()) return [];

  return prisma.publicDecisionRecord.findMany({
    where: {
      status: "published",
      ...(decisionType ? { decisionType } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      summary: true,
      decisionType: true,
      rationale: true,
      impactedSystems: true,
      charterVersion: true,
      disputeContact: true,
      publishedAt: true,
    },
  });
}

export async function listDecisionTypes() {
  if (!isPublicDecisionRegisterV2Enabled()) return [];
  const records = await prisma.publicDecisionRecord.findMany({
    where: { status: "published" },
    select: { decisionType: true },
    distinct: ["decisionType"],
  });
  return records.map((r) => r.decisionType);
}

/** Legacy path when phase9 enabled but Y4 v2 off */
export async function publishDecisionRecordLegacy(params: {
  title: string;
  summary: string;
  decisionType: string;
  rationale?: string;
}) {
  if (!phase9Config.publicDecisionRegisterEnabled) {
    throw new Error("DECISION_REGISTER_DISABLED");
  }
  if (y4CivicPlatformConfig.publicDecisionRegisterV2Enabled) {
    return publishDecisionRecord(params);
  }
  return prisma.publicDecisionRecord.create({
    data: {
      ...params,
      status: "published",
      publishedAt: new Date(),
    },
  });
}
