import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminShiftDetailPage({
  params,
}: {
  params: Promise<{ shiftId: string }>;
}) {
  await requireAdmin();
  const { shiftId } = await params;
  const shift = await prisma.careShift.findUnique({
    where: { id: shiftId },
    include: { careRequest: true, participant: { select: { name: true } } },
  });
  if (!shift) return <p>Not found</p>;
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Shift review</h1>
      <p>Participant: {shift.participant.name}</p>
      <p>Request: {shift.careRequest.title}</p>
      <p>Status: {shift.status}</p>
    </div>
  );
}
