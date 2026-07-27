import { readAccessEvidenceTool } from "./read-access-evidence";
import { readUpcomingAppointmentsTool } from "./read-appointments";
import { readCarePreferencesTool } from "./read-care-preferences";
import {
  readExistingCareRequestsTool,
  readExistingTransportRequestsTool,
} from "./read-existing-arrangements";
import { readMyDaySummaryTool } from "./read-my-day-summary";
import { readTransportOptionsTool } from "./read-transport-options";
import { CareOSToolRegistry } from "./registry";
import { searchCompatibleWorkersTool } from "./search-compatible-workers";

export function createCareOSToolRegistry(): CareOSToolRegistry {
  const registry = new CareOSToolRegistry();
  registry.register(readUpcomingAppointmentsTool);
  registry.register(readCarePreferencesTool);
  registry.register(readExistingCareRequestsTool);
  registry.register(readExistingTransportRequestsTool);
  registry.register(readMyDaySummaryTool);
  registry.register(searchCompatibleWorkersTool);
  registry.register(readTransportOptionsTool);
  registry.register(readAccessEvidenceTool);
  return registry;
}
