import { canDeleteReview, canEditReview } from "@/lib/access/reviews/review-access-policy";
import { recomputePlaceRatingSummaries } from "@/lib/access/reviews/review-summary-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { updateAccessReviewSchema } from "@/lib/validation/access-review";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { reviewId } = await params;

  const existing = await prisma.accessPlaceReview.findUnique({
    where: { id: reviewId },
  });
  if (!existing) return jsonError("Not found", 404);
  if (!canEditReview(user, existing.reviewerProfileId)) {
    return jsonError("Forbidden", 403);
  }

  const body = await req.json();
  const parsed = updateAccessReviewSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const review = await prisma.accessPlaceReview.update({
    where: { id: reviewId },
    data: {
      ...(parsed.data.reviewBody != null ? { reviewBody: parsed.data.reviewBody } : {}),
      ...(parsed.data.mobilityContext != null
        ? { mobilityContext: parsed.data.mobilityContext }
        : {}),
      ...(parsed.data.publish != null
        ? { status: parsed.data.publish ? "pending" : "draft" }
        : {}),
    },
  });

  return jsonOk({ review: { id: review.id, status: review.status } });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { reviewId } = await params;

  const existing = await prisma.accessPlaceReview.findUnique({
    where: { id: reviewId },
  });
  if (!existing) return jsonError("Not found", 404);
  if (!canDeleteReview(user, existing.reviewerProfileId)) {
    return jsonError("Forbidden", 403);
  }

  await prisma.accessPlaceReview.update({
    where: { id: reviewId },
    data: { status: "hidden" },
  });
  await recomputePlaceRatingSummaries(existing.placeId);

  return jsonOk({ ok: true });
}
