import type { AccessRatingCategory } from "@prisma/client";

import { ratingValueToScore } from "@/lib/access/reviews/access-rating-service";
import { prisma } from "@/lib/prisma";

export async function recomputePlaceRatingSummaries(placeId: string) {
  const reviews = await prisma.accessPlaceReview.findMany({
    where: { placeId, status: "published" },
    include: { ratings: true },
  });

  const byCategory = new Map<AccessRatingCategory, number[]>();

  for (const review of reviews) {
    for (const r of review.ratings) {
      const score = ratingValueToScore(r.value);
      if (score == null) continue;
      const list = byCategory.get(r.category) ?? [];
      list.push(score);
      byCategory.set(r.category, list);
    }
  }

  const activeCategories = [...byCategory.keys()];

  if (activeCategories.length === 0) {
    await prisma.accessRatingSummary.deleteMany({ where: { placeId } });
    return;
  }

  await prisma.accessRatingSummary.deleteMany({
    where: { placeId, category: { notIn: activeCategories } },
  });

  for (const [category, scores] of byCategory) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    await prisma.accessRatingSummary.upsert({
      where: { placeId_category: { placeId, category } },
      create: {
        placeId,
        category,
        avgScore: avg,
        sampleCount: scores.length,
      },
      update: {
        avgScore: avg,
        sampleCount: scores.length,
      },
    });
  }
}
