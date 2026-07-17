import { prisma } from "@/lib/prisma";
import { parseMobilityRequirements } from "@/lib/transport/mobility-schema";
import {
  checkDriverEligibilityForTrip,
  checkVehicleEligibility,
} from "@/lib/transport/transport-eligibility-service";

export type TransportMatchSuggestion = {
  vehicleId: string;
  vehicleName: string;
  driverId?: string;
  driverName?: string;
  score: number;
  eligible: boolean;
  reasons: string[];
};

export async function suggestMatchesForTrip(params: {
  organisationId: string;
  tripId: string;
  limit?: number;
}): Promise<TransportMatchSuggestion[]> {
  const trip = await prisma.transportTrip.findUnique({
    where: { id: params.tripId },
  });
  if (!trip || trip.providerOrganisationId !== params.organisationId) {
    return [];
  }

  const mobility = parseMobilityRequirements(trip.mobilityRequirements);

  const vehicles = await prisma.transportVehicle.findMany({
    where: { organisationId: params.organisationId, active: true },
    include: { features: true },
  });

  const drivers = await prisma.transportDriver.findMany({
    where: { organisationId: params.organisationId, active: true },
  });

  const suggestions: TransportMatchSuggestion[] = [];

  for (const vehicle of vehicles) {
    const vehicleCheck = await checkVehicleEligibility(vehicle.id, mobility);
    let bestDriver: (typeof drivers)[0] | undefined;
    let bestDriverCheck = { eligible: false, reasons: ["No driver scored"] };

    for (const driver of drivers) {
      const dCheck = await checkDriverEligibilityForTrip(driver.id, mobility);
      if (dCheck.eligible && (!bestDriver || bestDriverCheck.eligible === false)) {
        bestDriver = driver;
        bestDriverCheck = dCheck;
      }
    }

    let score = 0;
    const feature = vehicle.features[0];
    if (vehicleCheck.eligible) score += 50;
    if (bestDriverCheck.eligible) score += 30;
    if (feature?.wheelchairAccessible && mobility.requiresWheelchairAccessible)
      score += 10;
    if (feature?.assistanceAnimalFriendly && mobility.assistanceAnimalPresent)
      score += 5;

    suggestions.push({
      vehicleId: vehicle.id,
      vehicleName: vehicle.displayName,
      driverId: bestDriver?.id,
      driverName: bestDriver?.displayName,
      score,
      eligible: vehicleCheck.eligible && bestDriverCheck.eligible,
      reasons: [...vehicleCheck.reasons, ...bestDriverCheck.reasons],
    });
  }

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, params.limit ?? 10);
}
