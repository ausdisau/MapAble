import Link from "next/link";

import { ACCESS_LABELS } from "@/lib/access/map/copy";

export type AccessPlaceCardData = {
  id: string;
  name: string;
  category: string;
  suburb?: string | null;
  reviewCount?: number;
  confidence?: string;
};

export function AccessPlaceCard({ place }: { place: AccessPlaceCardData }) {
  return (
    <article className="rounded-lg border border-border p-4">
      <h3 className="text-lg font-semibold">
        <Link href={`/access/places/${place.id}`} className="hover:underline">
          {place.name}
        </Link>
      </h3>
      <p className="text-sm text-muted-foreground capitalize">
        {place.category.replace(/_/g, " ")}
        {place.suburb ? ` · ${place.suburb}` : ""}
      </p>
      <p className="mt-2 text-sm">
        {(place.reviewCount ?? 0) > 0
          ? ACCESS_LABELS.communityReviewed
          : ACCESS_LABELS.needsMore}
      </p>
    </article>
  );
}
