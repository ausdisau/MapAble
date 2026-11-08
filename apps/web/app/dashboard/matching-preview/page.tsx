import { notFound } from "next/navigation";

import { ParticipantMatchingPreview } from "@/components/matching/ParticipantMatchingPreview";
import { requireAuth } from "@/lib/auth/guards";
import { isParticipantMatchingPreviewEnabled } from "@/lib/matching/participant-preview-config";

export const metadata = {
  title: "Fictional worker matching preview | MapAble",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function MatchingPreviewPage() {
  if (!isParticipantMatchingPreviewEnabled()) notFound();

  const user = await requireAuth();
  if (!user.roles.includes("participant") && user.primaryRole !== "mapable_admin") {
    notFound();
  }

  // No participant or worker data is loaded here.
  return <ParticipantMatchingPreview />;
}
