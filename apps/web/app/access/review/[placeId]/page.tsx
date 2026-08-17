import Link from "next/link";

import { AddAccessReviewForm } from "@/components/access-reviews/AddAccessReviewForm";
import { prisma } from "@/lib/prisma";

export default async function AddReviewPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const { placeId } = await params;
  const place = await prisma.accessPlace.findFirst({
    where: { id: placeId, status: "published" },
    select: { id: true, name: true },
  });

  if (!place) {
    return <p className="p-8">Place not found.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Review {place.name}</h1>
      <p className="mt-2 text-sm">
        <Link href={`/access/places/${placeId}`} className="underline">
          Back to place
        </Link>
      </p>
      <div className="mt-6">
        <AddAccessReviewForm placeId={placeId} />
      </div>
    </div>
  );
}
