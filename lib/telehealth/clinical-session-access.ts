import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export type ClinicalSessionAccessRole = "participant" | "clinician";

export class ClinicalSessionAccessError extends Error {
  readonly status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = "ClinicalSessionAccessError";
    this.status = status;
  }
}

/**
 * Ensure the caller is the authorized participant or clinician for the session.
 */
export async function assertClinicalSessionAccess(input: {
  user: CurrentUser;
  participantId: string;
  workerId?: string;
  bookingId?: string;
  appointmentId?: string;
}): Promise<ClinicalSessionAccessRole> {
  const { user, participantId, workerId, bookingId, appointmentId } = input;

  if (user.id === participantId) {
    return "participant";
  }

  if (workerId && user.id === workerId) {
    return "clinician";
  }

  if (bookingId) {
    const booking = await prisma.careBooking.findUnique({
      where: { id: bookingId },
      select: {
        participantId: true,
        bookingWorkers: {
          where: { active: true },
          select: {
            workerProfile: { select: { userId: true } },
          },
        },
      },
    });

    if (!booking) {
      throw new ClinicalSessionAccessError("Booking not found", 404);
    }
    if (booking.participantId === user.id) {
      return "participant";
    }
    if (
      booking.bookingWorkers.some((w) => w.workerProfile.userId === user.id)
    ) {
      return "clinician";
    }
  }

  if (appointmentId) {
    const room = await prisma.telehealthVideoRoom.findFirst({
      where: { appointmentId },
      select: {
        participants: { select: { userId: true, role: true } },
      },
    });

    const membership = room?.participants.find((p) => p.userId === user.id);
    if (membership) {
      return membership.role === "participant" ? "participant" : "clinician";
    }
  }

  throw new ClinicalSessionAccessError(
    "Forbidden: only the appointment participant or assigned clinician may start this session",
    403,
  );
}
