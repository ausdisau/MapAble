import { phase10Config } from "@/lib/config/phase10";
import {
  ALGORITHM_TRANSPARENCY_DISCLAIMER,
  isAlgorithmRegisterV2Enabled,
} from "@/lib/config/y4-civic-platform";
import { requireRatifiedCharter } from "@/lib/governance-charter/charter-gate-service";
import { prisma } from "@/lib/prisma";

const BLOCKED_CERTIFICATION_PHRASES = [
  "certified fair",
  "regulatory approval",
  "guaranteed unbiased",
];

export function assertTransparencyCopy(text: string) {
  const lower = text.toLowerCase();
  for (const phrase of BLOCKED_CERTIFICATION_PHRASES) {
    if (lower.includes(phrase)) {
      throw new Error("ALGORITHM_CERTIFICATION_CLAIM_BLOCKED");
    }
  }
}

export async function draftAlgorithm(params: {
  name: string;
  purpose: string;
  version: string;
  owner?: string;
  fairnessNotes?: string;
  linkedPolicyKey?: string;
  disputeContact?: string;
  reviewDueAt?: Date;
}) {
  if (!isAlgorithmRegisterV2Enabled()) {
    throw new Error("ALGORITHM_REGISTER_DISABLED");
  }

  assertTransparencyCopy(params.purpose);
  if (params.fairnessNotes) assertTransparencyCopy(params.fairnessNotes);

  return prisma.registeredAlgorithm.create({
    data: {
      ...params,
      linkedPolicyKey: params.linkedPolicyKey ?? "matching.explainability",
      disputeContact: params.disputeContact ?? "governance@mapable.example",
      status: "draft",
    },
  });
}

export async function submitAlgorithmForReview(algorithmId: string) {
  return prisma.registeredAlgorithm.update({
    where: { id: algorithmId },
    data: { status: "review" },
  });
}

export async function publishAlgorithm(params: {
  name: string;
  purpose: string;
  version: string;
  owner?: string;
  fairnessNotes?: string;
  linkedPolicyKey?: string;
  disputeContact?: string;
  reviewDueAt?: Date;
}) {
  if (!isAlgorithmRegisterV2Enabled()) {
    throw new Error("ALGORITHM_REGISTER_DISABLED");
  }

  await requireRatifiedCharter();
  assertTransparencyCopy(params.purpose);

  const draft = await draftAlgorithm(params);
  return prisma.registeredAlgorithm.update({
    where: { id: draft.id },
    data: {
      status: "published",
      publishedAt: new Date(),
      reviewDueAt: params.reviewDueAt ?? new Date(Date.now() + 180 * 86400000),
    },
  });
}

export async function publishAlgorithmById(algorithmId: string) {
  await requireRatifiedCharter();

  const algo = await prisma.registeredAlgorithm.findUnique({
    where: { id: algorithmId },
  });
  if (!algo) throw new Error("ALGORITHM_NOT_FOUND");
  if (algo.status !== "review" && algo.status !== "draft") {
    throw new Error("INVALID_ALGORITHM_STATUS");
  }

  assertTransparencyCopy(algo.purpose);

  return prisma.registeredAlgorithm.update({
    where: { id: algorithmId },
    data: {
      status: "published",
      publishedAt: new Date(),
      reviewDueAt: algo.reviewDueAt ?? new Date(Date.now() + 180 * 86400000),
    },
  });
}

export async function listPublishedAlgorithms() {
  if (!isAlgorithmRegisterV2Enabled()) {
    if (!phase10Config.publicAlgorithmRegisterEnabled) return [];
  }

  return prisma.registeredAlgorithm.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      purpose: true,
      version: true,
      owner: true,
      fairnessNotes: true,
      linkedPolicyKey: true,
      disputeContact: true,
      reviewDueAt: true,
      publishedAt: true,
    },
  });
}

export async function listAllAlgorithms() {
  return prisma.registeredAlgorithm.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export { ALGORITHM_TRANSPARENCY_DISCLAIMER };
