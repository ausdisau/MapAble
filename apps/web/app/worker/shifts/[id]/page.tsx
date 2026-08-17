import Link from "next/link";
import { notFound } from "next/navigation";

import { AccessNeedsSummary } from "@/components/care/AccessNeedsSummary";
import { ShiftStatusStepper } from "@/components/care/ShiftStatusStepper";
import { SupportTasksSummary } from "@/components/care/SupportTasksSummary";
import { WorkerShiftActions } from "@/components/care/WorkerShiftActions";
import { requirePermission } from "@/lib/auth/guards";
import { assertWorkerAssignedToShift } from "@/lib/care/access-control";
import { filterParticipantInfoForWorker } from "@/lib/care/care-participant-info";
import { prisma } from "@/lib/prisma";

export default async function WorkerShiftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("care:shift:work");
  const { id } = await params;

  const shift = await prisma.careShift.findUnique({
    where: { id },
    include: { careRequest: true },
  });
  if (!shift) notFound();

  try {
    await assertWorkerAssignedToShift(user, shift);
  } catch {
    notFound();
  }

  const info = filterParticipantInfoForWorker(user, shift.careRequest, shift);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{info.displayLabel}</h1>
      <ShiftStatusStepper status={shift.status} />
      {info.location ? (
        <p className="text-sm">
          <span className="font-medium">Location:</span> {info.location}
        </p>
      ) : null}
      <SupportTasksSummary tasks={info.tasks} />
      <AccessNeedsSummary summary={info.accessSummary} />
      <WorkerShiftActions shiftId={shift.id} status={shift.status} />
      <p className="flex flex-wrap gap-4 text-sm">
        <Link href={`/worker/service-log?shiftId=${shift.id}`} className="underline">
          Submit service log
        </Link>
        <Link href={`/worker/report-issue?shiftId=${shift.id}`} className="underline">
          Report issue
        </Link>
      </p>
    </div>
  );
}
