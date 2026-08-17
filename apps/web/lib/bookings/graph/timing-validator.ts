import { prisma } from "@/lib/prisma";

export type TimingIssue = {
  code: string;
  message: string;
  severity: "warning" | "error";
  entityType?: string;
  entityId?: string;
};

export type TimingValidationResult = {
  valid: boolean;
  issues: TimingIssue[];
  reliabilitySummary: string;
};

export async function validateCareRequestTiming(
  careRequestId: string
): Promise<TimingValidationResult> {
  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
    include: { shifts: true },
  });

  const issues: TimingIssue[] = [];

  if (!request) {
    return {
      valid: false,
      issues: [
        {
          code: "not_found",
          message: "Care request not found",
          severity: "error",
        },
      ],
      reliabilitySummary: "We could not review timing for this request.",
    };
  }

  const shifts = request.shifts;
  for (let i = 0; i < shifts.length; i++) {
    const a = shifts[i];
    for (let j = i + 1; j < shifts.length; j++) {
      const b = shifts[j];
      if (a.startAt < b.endAt && b.startAt < a.endAt) {
        issues.push({
          code: "shift_overlap",
          message: "Two care shifts overlap in time",
          severity: "error",
          entityType: "care_shift",
          entityId: a.id,
        });
      }
    }
    if (a.endAt <= a.startAt) {
      issues.push({
        code: "invalid_shift_duration",
        message: "A care shift ends before it starts",
        severity: "error",
        entityType: "care_shift",
        entityId: a.id,
      });
    }
    if (a.participantApprovalStatus === "pending") {
      issues.push({
        code: "approval_pending",
        message: "A shift is waiting for your approval before it can be confirmed",
        severity: "warning",
        entityType: "care_shift",
        entityId: a.id,
      });
    }
  }

  const transportBookings = await prisma.transportBooking.findMany({
    where: {
      OR: [
        { careRequestId },
        { careShiftId: { in: shifts.map((s) => s.id) } },
      ],
    },
  });

  for (const tb of transportBookings) {
    if (!tb.pickupAddress?.trim() || !tb.dropoffAddress?.trim()) {
      issues.push({
        code: "missing_addresses",
        message: "Transport booking is missing pickup or drop-off details",
        severity: "error",
        entityType: "transport_booking",
        entityId: tb.id,
      });
    }
    if (tb.careShiftId) {
      const shift = shifts.find((s) => s.id === tb.careShiftId);
      if (shift && tb.pickupWindowStart > shift.startAt) {
        issues.push({
          code: "transport_after_shift_start",
          message:
            "Pickup is scheduled after the linked care shift starts — you may need more travel time",
          severity: "warning",
          entityType: "transport_booking",
          entityId: tb.id,
        });
      }
    }
  }

  const errors = issues.filter((i) => i.severity === "error");
  const summary =
    errors.length > 0
      ? `${errors.length} timing issue(s) need attention before confirming bookings.`
      : issues.length > 0
        ? `${issues.length} reminder(s) — review timing before you confirm.`
        : "Timing looks consistent based on current bookings.";

  return {
    valid: errors.length === 0,
    issues,
    reliabilitySummary: summary,
  };
}
