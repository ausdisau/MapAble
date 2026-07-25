import Link from "next/link";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { ProviderWorkerDetailActions } from "@/components/provider/ProviderWorkerDetailActions";
import { RegistrationShieldStatus } from "@/components/provider/RegistrationShieldStatus";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { isPlatformShieldEnabled } from "@/lib/config/strategic-2026";
import { prisma } from "@/lib/prisma";

export default async function WorkerDetailPage({
  params,
}: {
  params: Promise<{ workerId: string }>;
}) {
  const user = await requireAuth();
  const { workerId } = await params;
  const canManage = hasPermission(user.primaryRole, "worker:manage:org");
  const orgIds = canManage ? await getUserOrganisationIds(user.id) : [];

  const profile = await prisma.workerProfile.findFirst({
    where: canManage
      ? { id: workerId, organisationId: { in: orgIds } }
      : { id: workerId, userId: user.id },
  });

  if (!profile) return <p className="p-8">Not found</p>;

  return (
    <div className="space-y-6 px-4 py-8">
      <Link href="/provider/workers" className="text-sm text-primary underline">
        ← Workers
      </Link>
      <div>
        <h1 className="font-heading text-2xl font-bold">{profile.displayName}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <StatusTextBadge status={profile.verificationStatus} />
          {!profile.active ? <StatusTextBadge status="inactive" /> : null}
        </div>
      </div>
      {profile.profileSummary ? (
        <p className="text-muted-foreground">{profile.profileSummary}</p>
      ) : null}

      {canManage && orgIds.includes(profile.organisationId) ? (
        <ProviderWorkerDetailActions
          workerId={profile.id}
          organisationId={profile.organisationId}
          displayName={profile.displayName}
          profileSummary={profile.profileSummary}
          active={profile.active}
        />
      ) : null}

      {isPlatformShieldEnabled() && canManage ? (
        <RegistrationShieldStatus
          workerId={profile.id}
          providerId={profile.organisationId}
        />
      ) : null}

      <Link href="/provider/billing" className="text-primary underline">
        Manage compliance documents
      </Link>
    </div>
  );
}
