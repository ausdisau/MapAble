import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminAccessReviewsPage() {
  await requireAdmin();
  const reviews = await prisma.accessPlaceReview.findMany({
    where: { status: "pending" },
    take: 50,
    include: { place: { select: { name: true, id: true } } },
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Pending reviews</h1>
      <Link href="/admin/access/moderation" className="text-sm underline">
        Open moderation queue
      </Link>
      <ul className="space-y-2">
        {reviews.map((r) => (
          <li key={r.id} className="border rounded p-3">
            <Link href={`/access/places/${r.placeId}`} className="font-medium underline">
              {r.place.name}
            </Link>
            <p className="text-sm mt-1 line-clamp-2">{r.reviewBody}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
