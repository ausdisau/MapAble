import Link from "next/link";
import { notFound } from "next/navigation";

import { logAdminSensitiveAccess } from "@/lib/audit/audit-event-service";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminParticipantAccessibilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;

  const profile = await prisma.accessibilityProfile.findUnique({
    where: { userId: id },
  });

  if (!profile) notFound();

  await logAdminSensitiveAccess({
    actorUserId: admin.id,
    actorRole: admin.primaryRole as never,
    entityType: "AccessibilityProfile",
    entityId: profile.id,
    participantId: id,
  });

  const mobility = (profile.mobilityNeeds as string[]) ?? [];
  const transport = profile.transportRequirements as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/participants/${id}`}
        className="text-sm text-primary hover:underline"
      >
        ← Participant
      </Link>
      <h1 className="font-heading text-2xl font-bold">Accessibility (admin view)</h1>
      <p className="text-sm text-muted-foreground">
        This access is logged. Only share with providers when consent exists.
      </p>
      <dl className="space-y-3 rounded-xl border border-border bg-card p-4 text-sm">
        <div>
          <dt className="font-medium">Mobility</dt>
          <dd>{mobility.join(", ") || "None recorded"}</dd>
        </div>
        <div>
          <dt className="font-medium">Transport requirements</dt>
          <dd>
            <pre className="mt-1 overflow-auto text-xs">
              {JSON.stringify(transport, null, 2)}
            </pre>
          </dd>
        </div>
      </dl>
    </div>
  );
}
