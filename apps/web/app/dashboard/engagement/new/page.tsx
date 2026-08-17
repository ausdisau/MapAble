import Link from "next/link";
import { redirect } from "next/navigation";

import { EngagementRightsPanel } from "@/components/engagement/EngagementRightsPanel";
import { EngagementSubmissionForm } from "@/components/engagement/EngagementSubmissionForm";
import { requireAuth } from "@/lib/auth/guards";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { resolveEngagementParticipantId } from "@/lib/engagement/engagement-access";

export const metadata = { title: "Share feedback | MapAble Core" };

export default async function NewEngagementPage({
  searchParams,
}: {
  searchParams: Promise<{ participantId?: string; type?: string }>;
}) {
  if (!isEngagementPlatformEnabled()) redirect("/dashboard");

  const user = await requireAuth();
  const params = await searchParams;

  const resolved = await resolveEngagementParticipantId({
    userId: user.id,
    role: user.primaryRole,
    requestedParticipantId:
      params.participantId ??
      (user.primaryRole === "participant" ? user.id : undefined),
  });

  if (!resolved || resolved.mode === "delegate_read") {
    redirect("/dashboard/engagement");
  }

  const defaultType =
    params.type === "complaint" ? "complaint" : "general_feedback";

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <Link href="/dashboard/engagement" className="text-sm text-primary hover:underline">
          ← Back to Your voice
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">Share feedback</h1>
      </header>
      <EngagementRightsPanel />
      <EngagementSubmissionForm
        participantId={resolved.participantId}
        defaultType={defaultType}
      />
    </div>
  );
}
