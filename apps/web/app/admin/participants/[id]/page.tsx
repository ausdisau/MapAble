import Link from "next/link";
import { notFound } from "next/navigation";

import { ParticipantProfileSummary } from "@/components/admin/ParticipantProfileSummary";
import { logAdminSensitiveAccess } from "@/lib/audit/audit-event-service";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminParticipantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;

  const profile = await prisma.participantProfile.findUnique({
    where: { userId: id },
    include: { user: true },
  });

  if (!profile) notFound();

  await logAdminSensitiveAccess({
    actorUserId: admin.id,
    actorRole: admin.primaryRole as never,
    entityType: "ParticipantProfile",
    entityId: profile.id,
    participantId: id,
  });

  return (
    <div className="space-y-6">
      <Link href="/admin/participants" className="text-sm text-primary hover:underline">
        ← Participants
      </Link>
      <ParticipantProfileSummary
        displayName={profile.displayName}
        preferredName={profile.preferredName}
        homeSuburb={profile.homeSuburb}
        homeState={profile.homeState}
        role={profile.user.primaryRole}
        email={profile.user.email}
      />
      {profile.adminNotes ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:bg-amber-950">
          <h2 className="font-semibold">Admin notes (restricted)</h2>
          <p className="mt-2 text-sm">{profile.adminNotes}</p>
        </section>
      ) : null}
      <Link
        href={`/admin/participants/${id}/accessibility`}
        className="text-sm font-medium text-primary hover:underline"
      >
        View accessibility profile →
      </Link>
    </div>
  );
}
