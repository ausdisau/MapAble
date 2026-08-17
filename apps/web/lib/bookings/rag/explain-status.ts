import type { BookingRecordType, BookingStatusExplanation } from "./types";

const CARE_STATUS_COPY: Record<
  string,
  { summary: string; nextSteps: string[]; participant: string[]; provider: string[] }
> = {
  pending_provider: {
    summary: "Waiting for the provider to accept or decline this care booking.",
    nextSteps: [
      "Provider reviews the request and responds.",
      "You will be notified when the status changes.",
    ],
    participant: ["Check back for provider response.", "Contact support if urgent."],
    provider: ["Review the care request and accept or decline.", "Assign a worker once accepted."],
  },
  accepted: {
    summary: "The provider has accepted this care booking.",
    nextSteps: ["Worker assignment may follow.", "Confirm schedule details if needed."],
    participant: ["Review scheduled time and location.", "Update access notes if anything changed."],
    provider: ["Assign a support worker.", "Confirm service agreement if required."],
  },
  worker_assigned: {
    summary: "A support worker has been assigned to this booking.",
    nextSteps: ["Service proceeds at the scheduled time.", "Service log submitted after delivery."],
    participant: ["Confirm the visit time.", "Review worker details in your booking."],
    provider: ["Ensure worker is rostered.", "Complete service log after the shift."],
  },
  in_progress: {
    summary: "This care booking is currently in progress.",
    nextSteps: ["Service is underway.", "A service log will be submitted when complete."],
    participant: ["Contact the provider if you need changes during the visit."],
    provider: ["Monitor the shift.", "Submit service log when finished."],
  },
  completed: {
    summary: "This care booking is marked completed.",
    nextSteps: ["Review the service log.", "Raise a dispute within the allowed window if needed."],
    participant: ["Confirm the service log if prompted.", "Provide feedback if offered."],
    provider: ["Ensure service log is submitted and confirmed."],
  },
  disputed: {
    summary: "This care booking or its service log is disputed.",
    nextSteps: ["A coordinator will review the dispute.", "Avoid further changes until resolved."],
    participant: ["Check messages for updates.", "Provide any requested evidence."],
    provider: ["Respond to dispute review.", "Do not re-bill until resolved."],
  },
  cancelled: {
    summary: "This care booking was cancelled.",
    nextSteps: ["No further action unless rescheduled."],
    participant: ["Create a new request if you still need support."],
    provider: ["Archive roster entries for this booking."],
  },
  declined: {
    summary: "The provider declined this care booking.",
    nextSteps: ["Consider another provider or adjust the request."],
    participant: ["Search for alternative providers.", "Update your request details if needed."],
    provider: ["No further action required."],
  },
};

const TRANSPORT_STATUS_COPY: Record<
  string,
  { summary: string; nextSteps: string[]; participant: string[]; provider: string[] }
> = {
  draft: {
    summary: "This transport booking is still a draft.",
    nextSteps: ["Complete and submit the booking request."],
    participant: ["Review pickup and drop-off details.", "Submit when ready."],
    provider: [],
  },
  requested: {
    summary: "Transport has been requested and is awaiting operator response.",
    nextSteps: ["Operator reviews accessibility and vehicle fit."],
    participant: ["Wait for confirmation.", "Keep pickup window available."],
    provider: ["Review vehicle suitability.", "Accept or decline the trip."],
  },
  confirmed: {
    summary: "Transport is confirmed.",
    nextSteps: ["Driver assignment may follow.", "Be ready at the pickup window."],
    participant: ["Confirm pickup location.", "Share access notes if consented."],
    provider: ["Assign driver and vehicle.", "Share ETA when available."],
  },
  in_transit: {
    summary: "Transport is in progress.",
    nextSteps: ["Trip is underway."],
    participant: ["Contact operator only if urgent."],
    provider: ["Monitor trip progress."],
  },
  completed: {
    summary: "Transport trip completed.",
    nextSteps: ["Review trip details.", "Raise issues promptly if needed."],
    participant: ["Confirm drop-off was satisfactory."],
    provider: ["Close out the trip record."],
  },
  cancelled: {
    summary: "Transport booking was cancelled.",
    nextSteps: ["Rebook if still needed."],
    participant: ["Submit a new transport request if required."],
    provider: ["Free assigned resources."],
  },
  disputed: {
    summary: "This transport booking is disputed.",
    nextSteps: ["Await coordinator review."],
    participant: ["Provide trip details if asked."],
    provider: ["Respond to dispute workflow."],
  },
};

const BUNDLE_STATUS_COPY: Record<
  string,
  { summary: string; nextSteps: string[]; participant: string[]; provider: string[] }
> = {
  requested: {
    summary: "Combined care and transport booking has been requested.",
    nextSteps: ["Care and transport segments are reviewed together."],
    participant: ["Check both care and transport timings.", "Confirm consent for shared access notes."],
    provider: ["Coordinate care and transport segments.", "Validate buffer times between segments."],
  },
  confirmed: {
    summary: "Combined booking is confirmed.",
    nextSteps: ["Care visit and transport legs should align on the timeline."],
    participant: ["Review the full journey in your booking timeline."],
    provider: ["Confirm workers, drivers, and segment buffers."],
  },
  in_progress: {
    summary: "Combined booking is in progress.",
    nextSteps: ["One or more segments are active."],
    participant: ["Follow updates in the booking timeline."],
    provider: ["Monitor all segments until completion."],
  },
  completed: {
    summary: "Combined booking is complete.",
    nextSteps: ["Review service logs and transport record."],
    participant: ["Confirm each segment.", "Dispute within policy windows if needed."],
    provider: ["Submit evidence for care and transport legs."],
  },
};

function lookupCopy(
  recordType: BookingRecordType,
  status: string,
): { summary: string; nextSteps: string[]; participant: string[]; provider: string[] } {
  const normalized = status.toLowerCase();
  if (recordType === "care") {
    return (
      CARE_STATUS_COPY[normalized] ?? {
        summary: `Care booking status: ${status}.`,
        nextSteps: ["Check your bookings page for the latest updates."],
        participant: ["Contact your provider if unsure."],
        provider: ["Update booking status when actions complete."],
      }
    );
  }
  if (recordType === "transport") {
    return (
      TRANSPORT_STATUS_COPY[normalized] ?? {
        summary: `Transport booking status: ${status}.`,
        nextSteps: ["Check your transport bookings for details."],
        participant: ["Contact the operator if you need help."],
        provider: ["Update trip status as it progresses."],
      }
    );
  }
  return (
    BUNDLE_STATUS_COPY[normalized] ?? {
      summary: `Booking status: ${status}.`,
      nextSteps: ["Review the booking timeline for segment updates."],
      participant: ["Check care and transport segments."],
      provider: ["Keep segment statuses in sync."],
    }
  );
}

export function explainBookingStatus(input: {
  bookingId: string;
  recordType: BookingRecordType;
  status: string;
}): BookingStatusExplanation {
  const copy = lookupCopy(input.recordType, input.status);
  return {
    bookingId: input.bookingId,
    recordType: input.recordType,
    status: input.status,
    summary: copy.summary,
    nextSteps: copy.nextSteps,
    participantActions: copy.participant,
    providerActions: copy.provider,
  };
}
