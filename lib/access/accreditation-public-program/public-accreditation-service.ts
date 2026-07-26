import { prisma } from "@/lib/prisma";

export async function publishAccreditationProfile(params: {
  caseId?: string;
  title: string;
  summary: string;
  approvedById: string;
}) {
  const draft = await prisma.publicAccreditationProfile.create({
    data: {
      caseId: params.caseId,
      title: params.title,
      summary: params.summary,
      status: "approved",
    },
  });

  return prisma.publicAccreditationProfile.update({
    where: { id: draft.id },
    data: {
      status: "published",
      publishedAt: new Date(),
    },
  });
}

export async function listPublishedAccreditation() {
  return prisma.publicAccreditationProfile.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });
}
