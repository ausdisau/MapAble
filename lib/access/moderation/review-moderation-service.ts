import { publishReview } from "@/lib/access/reviews/access-review-service";
import { prisma } from "@/lib/prisma";

export async function listModerationQueue(status = "pending") {
  return prisma.accessModerationQueue.findMany({
    where: { status: status as never },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    include: { review: { include: { place: true } } },
    take: 100,
  });
}

export async function decideModeration(params: {
  queueId: string;
  moderatorId: string;
  status: "approved" | "rejected" | "hidden" | "needs_changes";
  notes?: string;
}) {
  const item = await prisma.accessModerationQueue.update({
    where: { id: params.queueId },
    data: { status: params.status as never },
    include: { review: true },
  });

  await prisma.accessModerationDecision.create({
    data: {
      queueId: params.queueId,
      moderatorId: params.moderatorId,
      status: params.status as never,
      notes: params.notes,
    },
  });

  if (item.reviewId) {
    if (params.status === "approved") {
      await publishReview(item.reviewId, params.moderatorId);
    } else if (params.status === "rejected" || params.status === "hidden") {
      await prisma.accessPlaceReview.update({
        where: { id: item.reviewId },
        data: { status: params.status === "rejected" ? "rejected" : "hidden" },
      });
    }
  }

  return item;
}
