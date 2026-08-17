import { prisma } from "@/lib/prisma";
import { calcomAdapter } from "@/lib/scheduling/calcom-adapter";
import { internalSchedulingAdapter } from "@/lib/scheduling/internal-scheduling-adapter";
import type { SchedulingAdapter } from "@/lib/scheduling/scheduling-adapter";

export function getSchedulingProvider() {
  return process.env.SCHEDULING_PROVIDER === "calcom" ? "calcom" : "internal";
}

export function getSchedulingAdapter(): SchedulingAdapter {
  return getSchedulingProvider() === "calcom"
    ? calcomAdapter
    : internalSchedulingAdapter;
}

export async function bookAppointmentSlot(input: {
  slotId: string;
  participantId: string;
  practitionerId: string;
}) {
  const slot = await prisma.appointmentSlot.update({
    where: { id: input.slotId },
    data: { status: "booked" },
  });

  const adapter = getSchedulingAdapter();
  let externalBookingId: string | undefined;
  if (adapter.createExternalBookingReference) {
    const ref = await adapter.createExternalBookingReference(input.slotId);
    externalBookingId = ref.externalBookingId;
    await prisma.externalSchedulingLink.create({
      data: {
        appointmentId: slot.id,
        externalProvider: getSchedulingProvider(),
        externalBookingId,
      },
    });
  }

  await prisma.schedulingSyncEvent.create({
    data: {
      eventType: "booked",
      status: "success",
      message: `Slot ${input.slotId}`,
    },
  });

  return { slot, externalBookingId };
}
