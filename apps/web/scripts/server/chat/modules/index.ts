import type { ChatModule } from "../types";
import { profileModule } from "./profile";
import { transportModule } from "./transport";
import { barriersModule } from "./barriers";
import { shiftsModule } from "./shifts";
import { billingModule } from "./billing";
import { ndisModule } from "./ndis";
import { groceryModule } from "./grocery";
import { safeguardingModule } from "./safeguarding";
import { handoffModule } from "./handoff";

/**
 * The full set of MapAble Chat capability modules. To add a new capability,
 * create a module file exporting a {@link ChatModule} and append it here.
 */
export const chatModules: ChatModule[] = [
  profileModule,
  transportModule,
  barriersModule,
  shiftsModule,
  billingModule,
  ndisModule,
  groceryModule,
  safeguardingModule,
  handoffModule,
];

export {
  profileModule,
  transportModule,
  barriersModule,
  shiftsModule,
  billingModule,
  ndisModule,
  groceryModule,
  safeguardingModule,
  handoffModule,
};
