import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { isWorkerAssistCopilotEnabled } from "@/lib/copilot/worker-assist-service";
import { prisma } from "@/lib/prisma";

import { WorkerAssistPanel } from "./WorkerAssistPanel";

export default async function WorkerShiftAssistPage({
  params,
}: {
  params: Promise<{ shiftId: string }>;
}) {
  const user = await requireAuth();
  const { shiftId } = await params;

  const worker = await prisma.workerProfile.findFirst({
    where: { userId: user.id, active: true },
  });

  if (!worker) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <p>No worker profile found.</p>
      </div>
    );
  }

  const shift = await prisma.careShift.findFirst({
    where: { id: shiftId, workerProfileId: worker.id },
  });

  if (!shift) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <p>Shift not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <Link href="/dashboard" className="text-sm text-primary underline">
        Back
      </Link>
      <h1 className="font-heading text-2xl font-bold">Shift assist</h1>
      <p className="text-sm text-muted-foreground">
        Shift {shift.startAt.toLocaleString("en-AU")} — {shift.status}
      </p>

      {!isWorkerAssistCopilotEnabled() ? (
        <p className="text-sm">Worker assist is not enabled in this environment.</p>
      ) : (
        <WorkerAssistPanel shiftId={shift.id} workerProfileId={worker.id} />
      )}
    </div>
  );
}
