import Link from "next/link";

import { AccreditationDisclaimer } from "@/components/access-accreditation/AccreditationDisclaimer";
import { AccreditationTierBadge } from "@/components/access-accreditation/AccreditationTierBadge";

export function AccreditationSummaryPanel({
  tier,
  totalScore,
  expired = false,
  placeId,
}: {
  tier: string;
  totalScore: number;
  expired?: boolean;
  placeId: string;
}) {
  return (
    <section
      aria-labelledby="accreditation-heading"
      className="rounded-lg border-2 border-foreground/20 p-4"
    >
      <h2 id="accreditation-heading" className="text-lg font-semibold">
        MapAble Accreditation (formal assessment)
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Separate from community reviews below.
      </p>
      <div className="mt-3">
        {expired ? (
          <p className="font-medium">Accreditation expired — renewal may be in progress.</p>
        ) : (
          <AccreditationTierBadge tier={tier} totalScore={totalScore} />
        )}
      </div>
      <AccreditationDisclaimer />
      <Link
        href={`/access/places/${placeId}/accreditation`}
        className="mt-3 inline-block text-sm underline"
      >
        View accreditation details
      </Link>
    </section>
  );
}
