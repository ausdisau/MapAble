import { getSchedulingProvider } from "@/lib/scheduling/appointment-booking-service";

export async function getPractitionerAvailability(
  practitionerId: string,
  from: Date,
  to: Date
) {
  const { getSchedulingAdapter } = await import(
    "@/lib/scheduling/appointment-booking-service"
  );
  return getSchedulingAdapter().listAvailability(practitionerId, from, to);
}

export function getSchedulingProviderName() {
  return getSchedulingProvider();
}
