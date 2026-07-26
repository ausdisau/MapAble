import { prisma } from "@/lib/prisma";

export async function draftGovernanceCharter(params: {
  version: string;
  title: string;
  body: string;
}) {
  return prisma.governanceCharter.upsert({
    where: { version: params.version },
    create: { ...params, status: "draft" },
    update: { title: params.title, body: params.body },
  });
}

export async function ratifyCharter(version: string) {
  return prisma.governanceCharter.update({
    where: { version },
    data: { status: "ratified", ratifiedAt: new Date() },
  });
}

export async function getActiveCharter() {
  return prisma.governanceCharter.findFirst({
    where: { status: "ratified" },
    orderBy: { ratifiedAt: "desc" },
  });
}

export async function listCharters() {
  return prisma.governanceCharter.findMany({
    orderBy: { createdAt: "desc" },
  });
}
