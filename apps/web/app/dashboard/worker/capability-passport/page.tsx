import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { isCapabilityPassportPreviewEnabled } from "@/lib/config/capability-passport";
import { prisma } from "@/lib/prisma";

import { CapabilityPassportClient } from "./CapabilityPassportClient";

export const metadata = { title: "My Capability Passport | MapAble" };

export default async function WorkerCapabilityPassportPage() {
  if (!isCapabilityPassportPreviewEnabled()) notFound();
  const user = await requireAuth();
  const worker = await prisma.workerProfile.findFirst({
    where: { userId: user.id, active: true },
    select: { id: true, displayName: true },
  });

  if (!worker) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <h1 className="font-heading text-2xl font-bold">My Capability Passport</h1>
        <p className="mt-2 text-muted-foreground">No active worker profile found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 motion-reduce:transition-none">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">My Capability Passport</h1>
        <p className="text-sm text-muted-foreground">
          Training completed is not demonstrated competence. Worker screening clearance is
          not a general safety guarantee. This preview does not issue clearance.
        </p>
      </header>
      <CapabilityPassportClient workerProfileId={worker.id} />
    </div>
  );
}
