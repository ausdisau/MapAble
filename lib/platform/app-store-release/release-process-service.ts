import { phase8Config } from "@/lib/config/phase8";
import { prisma } from "@/lib/prisma";

const DEFAULT_CHECKLIST = [
  { itemKey: "privacy_labels", title: "Store privacy labels complete" },
  { itemKey: "a11y_audit", title: "Accessibility audit signed off" },
  { itemKey: "crash_free", title: "Crash-free sessions threshold met" },
  { itemKey: "review_notes", title: "Reviewer notes prepared" },
];

export async function createAppStoreSubmission(platform: string, version: string) {
  if (!phase8Config.appStoreReleaseProcessEnabled) {
    throw new Error("APP_STORE_RELEASE_DISABLED");
  }
  return prisma.appStoreReleaseSubmission.create({
    data: {
      platform,
      version,
      checklistItems: { create: DEFAULT_CHECKLIST },
    },
    include: { checklistItems: true },
  });
}

export async function getAppStoreReleaseDashboard() {
  const submissions = await prisma.appStoreReleaseSubmission.findMany({
    include: { checklistItems: true },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  return submissions.map((s) => ({
    ...s,
    ready:
      s.checklistItems.length > 0 &&
      s.checklistItems.every((i) => i.completed),
  }));
}
