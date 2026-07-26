import { phase6Config } from "@/lib/config/phase6";
import { prisma } from "@/lib/prisma";

export async function getMobileReleaseChecklist(platform: string) {
  if (!phase6Config.mobileProductionReadinessEnabled) {
    return { disabled: true };
  }

  let track = await prisma.mobileReleaseTrack.findFirst({
    where: { platform },
    include: { checklists: true },
  });

  if (!track) {
    track = await prisma.mobileReleaseTrack.create({
      data: {
        platform,
        version: "0.1.0-pilot",
        status: "planning",
        checklists: {
          create: [
            { itemKey: "a11y_audit", title: "Accessibility audit completed" },
            { itemKey: "screen_reader", title: "Screen reader flows tested" },
            { itemKey: "privacy_labels", title: "Store privacy labels drafted" },
            { itemKey: "large_touch", title: "44px minimum touch targets verified" },
          ],
        },
      },
      include: { checklists: true },
    });
  }

  return track;
}
