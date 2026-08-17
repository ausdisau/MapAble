import type { CareOSContext } from "../context/careos-context";
import { composeMission } from "../missions/mission-composer";
import type { CareTransportMissionInput } from "../missions/mission-types";

import type { CareOSMissionResult } from "./orchestration-result";

/**
 * The manager is the only orchestration entry point. It chooses the bounded
 * mission flow; specialists are never allowed to hand off directly.
 */
export async function runCareOSManager(params: {
  input: CareTransportMissionInput;
  context: CareOSContext;
}): Promise<CareOSMissionResult> {
  return composeMission("CARE_TRANSPORT_APPOINTMENT", params.input, params.context);
}
