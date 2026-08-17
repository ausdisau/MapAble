import { z } from "zod";

export const supportSimulationScenarioSchema = z.object({
  scenarioName: z.enum([
    "late_worker",
    "worker_cancellation",
    "transport_cancellation",
    "inaccessible_station",
    "appointment_delay",
    "equipment_failure",
    "power_outage",
    "network_outage",
    "provider_withdrawal",
    "budget_reduction",
    "increased_support_requirement",
    "emergency_contact_unavailable",
    "hospital_discharge_coordination",
  ]),
  assumptions: z.array(z.string()).max(20),
  requiredSafeguards: z.array(z.string()).max(20),
  participantPreferences: z.array(z.string()).max(20),
});

export type SupportSimulation = {
  simulationId: string;
  scenarioName: string;
  assumptions: string[];
  options: Array<{ id: string; label: string; tradeOffs: Record<string, string> }>;
  constraints: string[];
  outcomes: Array<{ measure: string; result: "supported" | "at_risk" | "unknown"; explanation: string }>;
  uncertainty: string[];
  evidence: Array<{ sourceType: string; summary: string }>;
  humanReviewRequired: boolean;
  noOperationalChangeMade: true;
};

export function runDeterministicSupportSimulation(
  input: z.infer<typeof supportSimulationScenarioSchema>
): SupportSimulation {
  const parsed = supportSimulationScenarioSchema.parse(input);
  const disruption = parsed.scenarioName.replace(/_/g, " ");
  const isHospitalDischarge = parsed.scenarioName === "hospital_discharge_coordination";
  return {
    simulationId: `simulation_${crypto.randomUUID()}`,
    scenarioName: parsed.scenarioName,
    assumptions: parsed.assumptions,
    options: [
      {
        id: "preserve_current_arrangement",
        label: "Preserve the current arrangement where possible",
        tradeOffs: {
          participantGoals: "May reduce disruption if the existing arrangement remains available.",
          reliability: "Depends on the disrupted service recovering.",
          privacy: "Uses only the assumptions supplied to this simulation.",
        },
      },
      {
        id: "request_human_coordination",
        label: "Ask a human coordinator to review alternatives",
        tradeOffs: {
          participantGoals: "Supports participant choice when constraints conflict.",
          workerAvailability: "Requires verified availability from existing services.",
          budgetImpact: "Unknown until authorised budget information is reviewed.",
        },
      },
    ],
    constraints: parsed.requiredSafeguards,
    outcomes: [
      {
        measure: "participant goals supported",
        result: "at_risk",
        explanation: `The ${disruption} scenario may affect the planned arrangement.`,
      },
      {
        measure: "participant preference alignment",
        result: parsed.participantPreferences.length > 0 ? "supported" : "unknown",
        explanation: parsed.participantPreferences.length > 0
          ? "The simulation retains supplied participant preferences as constraints."
          : "No participant preferences were supplied to this simulation.",
      },
      {
        measure: "emergency resilience",
        result: "unknown",
        explanation: "CareOS does not interpret emergencies or replace a human-approved emergency plan.",
      },
    ],
    uncertainty: [
      "This is a decision-support simulation, not a prediction of real-world service availability.",
      ...(isHospitalDischarge
        ? ["CareOS does not decide clinical readiness for discharge."]
        : []),
    ],
    evidence: [
      { sourceType: "participant_supplied_assumption", summary: "Scenario assumptions supplied for this simulation." },
    ],
    humanReviewRequired: true,
    noOperationalChangeMade: true,
  };
}
