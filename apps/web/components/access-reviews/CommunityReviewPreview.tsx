import Link from "next/link";

export function CommunityReviewPreview({
  reviews,
  placeId,
}: {
  placeId: string;
  reviews: {
    id: string;
    displayName: string;
    reviewBody: string;
    label: string;
  }[];
}) {
  if (!reviews.length) {
    return (
      <p className="mt-2 text-muted-foreground">
        No published community reviews yet. Be the first to share your experience.
      </p>
    );
  }
  return (
    <ul className="mt-3 space-y-3">
      {reviews.slice(0, 3).map((r) => (
        <li key={r.id} className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">{r.label}</p>
          <p className="font-medium">{r.displayName}</p>
          <p className="mt-1 text-sm">{r.reviewBody.slice(0, 280)}</p>
        </li>
      ))}
      <li>
        <Link href={`/access/places/${placeId}/reviews`} className="text-sm underline">
          View all community reviews
        </Link>
      </li>
    </ul>
  );
}
