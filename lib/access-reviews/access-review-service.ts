import type { AccessDisplayNameMode, AccessRatingValue } from "@prisma/client";

import { scanReviewForModerationFlags } from "@/lib/access-moderation/content-safety-rules";
import { recomputePlaceRatingSummaries } from "@/lib/access-reviews/review-summary-service";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

const REVIEW_RATE_LIMIT_PER_HOUR = 10;

export async function createAccessReview(params: {
  placeId: string;
  reviewerProfileId: string;
  displayNameMode: AccessDisplayNameMode;
  reviewBody: string;
  mobilityContext?: string;
  visitDate?: Date;
  visibility?: "public" | "mapable_only";
  ratings: { category: string; value: AccessRatingValue }[];
  publish?: boolean;
}) {
  const flags = scanReviewForModerationFlags(params.reviewBody);
  const status = flags.length
    ? "pending"
    : params.publish
      ? "published"
      : "draft";

  const review = await prisma.$transaction(async (tx) => {
    const recentCount = await tx.accessPlaceReview.count({
      where: {
        reviewerProfileId: params.reviewerProfileId,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (recentCount >= REVIEW_RATE_LIMIT_PER_HOUR) {
      throw new Error("REVIEW_RATE_LIMIT");
    }

    if (params.publish) {
      const existingPublished = await tx.accessPlaceReview.findFirst({
        where: {
          placeId: params.placeId,
          reviewerProfileId: params.reviewerProfileId,
          status: "published",
        },
        select: { id: true },
      });
      if (existingPublished) {
        throw new Error("REVIEW_ALREADY_PUBLISHED");
      }
    }

    return tx.accessPlaceReview.create({
    data: {
      placeId: params.placeId,
      reviewerProfileId: params.reviewerProfileId,
      displayNameMode: params.displayNameMode,
      reviewBody: params.reviewBody,
      mobilityContext: params.mobilityContext,
      visitDate: params.visitDate,
      visibility: params.visibility ?? "public",
      status,
      ratings: {
        create: params.ratings.map((r) => ({
          category: r.category as never,
          value: r.value,
        })),
      },
      events: {
        create: {
          actorId: params.reviewerProfileId,
          action: "review.created",
          metadata: { flags },
        },
      },
    },
    include: { ratings: true },
    });
  });

  if (flags.length) {
    await prisma.accessModerationQueue.create({
      data: {
        entityType: "AccessPlaceReview",
        entityId: review.id,
        reviewId: review.id,
        flagReason: flags.join("; "),
      },
    });
  }

  await createAuditEvent({
    actorUserId: params.reviewerProfileId,
    action: "access_review.created",
    entityType: "AccessPlaceReview",
    entityId: review.id,
  });

  if (status === "published") {
    await recomputePlaceRatingSummaries(params.placeId);
  }

  return review;
}

export async function publishReview(reviewId: string, moderatorId?: string) {
  const review = await prisma.accessPlaceReview.update({
    where: { id: reviewId },
    data: { status: "published" },
  });

  await recomputePlaceRatingSummaries(review.placeId);

  if (moderatorId) {
    await createAuditEvent({
      actorUserId: moderatorId,
      action: "access_review.published",
      entityType: "AccessPlaceReview",
      entityId: reviewId,
    });
  }

  return review;
}

export async function listPublishedReviewsForPlace(placeId: string) {
  return prisma.accessPlaceReview.findMany({
    where: { placeId, status: "published", visibility: "public" },
    orderBy: { createdAt: "desc" },
    include: { ratings: true, photos: { where: { status: "approved" } } },
  });
}
