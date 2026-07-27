import type { CareOSContext } from "../context/careos-context";
import type { CareOSMissionResult } from "../orchestrator/orchestration-result";
import { composeCareTransportMission } from "./care-transport-mission";
import type { CareTransportMissionInput } from "./mission-types";

export async function composeMission(
  type: "CARE_TRANSPORT_APPOINTMENT",
  input: CareTransportMissionInput,
  context: CareOSContext
): Promise<CareOSMissionResult> {
  switch (type) {
    case "CARE_TRANSPORT_APPOINTMENT":
      return composeCareTransportMission(input, context);
    default: {
      const exhaustive: never = type;
      throw new Error(`Unsupported CareOS mission: ${exhaustive}`);
    }
  }
}
