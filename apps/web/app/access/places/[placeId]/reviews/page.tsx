import Link from "next/link";

import { listPublishedReviewsForPlace } from "@/lib/access/reviews/access-review-service";
import { publicReviewerDisplayName } from "@/lib/access/reviews/review-access-policy";
import { prisma } from "@/lib/prisma";

export default async function PlaceReviewsPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const { placeId } = await params;
  const place = await prisma.accessPlace.findFirst({
    where: { id: placeId, status: "published" },
    select: { name: true },
  });
  if (!place) return <p className="p-8">Place not found.</p>;

  const reviews = await listPublishedReviewsForPlace(placeId);
  const users = await prisma.user.findMany({
    where: { id: { in: reviews.map((r) => r.reviewerProfileId) } },
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-bold">Community reviews — {place.name}</h1>
      <p className="text-sm text-muted-foreground">User reported — not MapAble Accreditation.</p>
      <Link href={`/access/places/${placeId}`} className="text-sm underline">
        Back to place
      </Link>
      <ul className="space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Community review</p>
            <p className="font-medium">
              {publicReviewerDisplayName({
                mode: r.displayNameMode,
                userName: userMap.get(r.reviewerProfileId) ?? "Community member",
              })}
            </p>
            <p className="mt-2 whitespace-pre-wrap">{r.reviewBody}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
