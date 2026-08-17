import { prisma } from "@/lib/prisma";

export async function createVenueReviewResponse(params: {
  reviewId: string;
  venueUserId: string;
  body: string;
}) {
  return prisma.accessVenueReviewResponse.create({
    data: {
      reviewId: params.reviewId,
      venueUserId: params.venueUserId,
      body: params.body,
      status: "pending",
    },
  });
}
