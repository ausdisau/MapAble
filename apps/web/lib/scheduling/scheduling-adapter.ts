export type SchedulingProvider = "internal" | "calcom";

export interface SchedulingAdapter {
  listAvailability(practitionerId: string, from: Date, to: Date): Promise<
    Array<{ startsAt: Date; endsAt: Date }>
  >;
  createExternalBookingReference?(
    slotId: string
  ): Promise<{ externalBookingId: string }>;
}
