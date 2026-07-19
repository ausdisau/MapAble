import { prisma } from "@/lib/prisma";
import type { SchedulingAdapter } from "@/lib/scheduling/scheduling-adapter";

export const internalSchedulingAdapter: SchedulingAdapter = {
  async listAvailability(practitionerId, from, to) {
    const slots = await prisma.appointmentSlot.findMany({
      where: {
        practitionerId,
        status: "available",
        startsAt: { gte: from, lte: to },
      },
    });
    return slots.map((s) => ({ startsAt: s.startsAt, endsAt: s.endsAt }));
  },
};
