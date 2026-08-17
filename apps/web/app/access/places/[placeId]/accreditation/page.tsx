import Link from "next/link";

import { AccreditationDisclaimer } from "@/components/access-accreditation/AccreditationDisclaimer";
import { AccreditationTierBadge } from "@/components/access-accreditation/AccreditationTierBadge";
import { getPublishedAssessmentForPlace } from "@/lib/access/accreditation/accreditation-assessment-service";
import { prisma } from "@/lib/prisma";

export default async function PublicAccreditationPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const { placeId } = await params;
  const place = await prisma.accessPlace.findFirst({
    where: { id: placeId, status: "published" },
    select: { name: true },
  });
  if (!place) return <p className="p-8">Place not found</p>;

  const assessment = await getPublishedAssessmentForPlace(placeId);
  if (!assessment?.tier || assessment.totalScore == null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <p>No published MapAble Accreditation for this place.</p>
        <Link href={`/access/places/${placeId}`} className="underline text-sm">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-8">
      <h1 className="text-2xl font-bold">MapAble Accreditation — {place.name}</h1>
      <AccreditationTierBadge tier={assessment.tier} totalScore={assessment.totalScore} />
      <AccreditationDisclaimer />
      <Link href={`/access/places/${placeId}`} className="text-sm underline">
        Back to place
      </Link>
    </div>
  );
}
