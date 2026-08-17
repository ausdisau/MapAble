import Link from "next/link";

import { WorkerProfileForm } from "@/components/worker/WorkerProfileForm";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Worker profile | MapAble" };

export default async function WorkerProfilePage() {
  const user = await requireAuth();

  const profile = await prisma.workerProfile.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 py-10">
        <h1 className="font-heading text-2xl font-bold">Worker profile</h1>
        <p className="text-muted-foreground">
          You do not have a worker profile yet. Accept a provider invite to get started.
        </p>
        <Link href="/dashboard" className="text-primary underline">
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-10">
      <h1 className="font-heading text-2xl font-bold">Your worker profile</h1>
      <WorkerProfileForm
        workerId={profile.id}
        displayName={profile.displayName}
        profileSummary={profile.profileSummary}
        languages={profile.languages}
      />
      <Link href="/worker/onboarding" className="text-sm text-primary underline">
        View onboarding checklist
      </Link>
    </div>
  );
}
