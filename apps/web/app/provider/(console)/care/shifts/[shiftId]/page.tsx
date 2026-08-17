import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderShiftDetailPage({
  params,
}: {
  params: Promise<{ shiftId: string }>;
}) {
  await requireAuth();
  const { shiftId } = await params;
  const shift = await prisma.careShift.findUnique({
    where: { id: shiftId },
    include: { workerProfile: true, careRequest: true },
  });
  if (!shift) return <p role="alert">Shift not found.</p>;

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Care shift</h1>
      <StatusTextBadge status={shift.status} />
      <p>Worker: {shift.workerProfile?.displayName ?? "Unassigned"}</p>
      <p className="text-sm text-muted-foreground">
        GPS-verified check-in is not available in this pilot.
      </p>
    </div>
  );
}
