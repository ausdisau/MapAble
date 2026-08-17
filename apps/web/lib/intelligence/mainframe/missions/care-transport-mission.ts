import { syntheticVehicles, syntheticWorkers } from "../fixtures/care-transport-scenarios";
import type { DeliberationDraft } from "../types/deliberation-draft";
import type { SyntheticRightsSnapshot } from "../types/mainframe-context";

export function composeSyntheticCareTransportMission(
  goal: string,
  rights: SyntheticRightsSnapshot
): DeliberationDraft {
  const missingFields = /pickup|from\s+/i.test(goal) ? [] : ["pickup location"];
  if (missingFields.length > 0) {
    return {
      draftStatus: "INCOMPLETE",
      goalCategory: "COORDINATE_SUPPORTED_APPOINTMENT",
      missingFields,
      candidateProposals: [],
      constraintChecks: ["PICKUP_LOCATION_REQUIRED"],
      uncertainties: [],
      threatSignals: [],
      suggestedHumanReview: false,
      evidenceReferences: [],
    };
  }
  const workers = syntheticWorkers.filter(
    (worker) =>
      !rights.blockedWorkerIds.includes(worker.id) &&
      !rights.blockedProviderIds.includes(worker.providerId) &&
      rights.requiredCredentials.every((item) => worker.credentials.includes(item)) &&
      rights.requiredCommunicationCapabilities.every((item) =>
        worker.communicationCapabilities.includes(item)
      )
  );
  const vehicles = syntheticVehicles.filter(
    (vehicle) =>
      !rights.blockedProviderIds.includes(vehicle.providerId) &&
      rights.requiredVehicleFeatures.every((item) => vehicle.features.includes(item))
  );
  const candidateProposals = workers.flatMap((worker) =>
    vehicles
      .filter((vehicle) => vehicle.providerId === worker.providerId)
      .map((vehicle) => ({
        id: `syn_proposal_${worker.id}_${vehicle.id}`,
        workerId: worker.id,
        vehicleId: vehicle.id,
        summary: `${worker.name} with ${vehicle.name}; synthetic preparation, boarding, travel and handover buffers are included.`,
        evidenceReferences: [worker.id, vehicle.id, "syn_destination_access_001"],
      }))
  ).slice(0, 3);

  return {
    draftStatus: "COMPLETE",
    goalCategory: "COORDINATE_SUPPORTED_APPOINTMENT",
    missingFields: [],
    candidateProposals,
    constraintChecks: ["BLOCKED_CANDIDATES_EXCLUDED", "ACCESS_REQUIREMENTS_PRESERVED"],
    uncertainties: ["Synthetic fixtures do not represent real availability or destination access."],
    threatSignals: [],
    suggestedHumanReview: candidateProposals.length === 0,
    evidenceReferences: ["syn_destination_access_001"],
  };
}
