import { CareShiftApproval } from "@/components/care/CareShiftApproval";
import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function CareShiftDetailPage({
  params,
}: {
  params: Promise<{ shiftId: string }>;
}) {
  const user = await requirePermission("care:read:self");
  const { shiftId } = await params;
  const shift = await prisma.careShift.findFirst({
    where: { id: shiftId, participantId: user.id },
  });
  if (!shift) return <p role="alert">Shift not found.</p>;

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Care shift</h1>
      <StatusTextBadge status={shift.status} />
      <p>
        {shift.startAt.toLocaleString("en-AU")} —{" "}
        {shift.endAt.toLocaleString("en-AU")}
      </p>
      <CareShiftApproval shiftId={shift.id} status={shift.status} />
    </div>
  );
}
