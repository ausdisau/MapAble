import { Agent } from "@openai/agents";

/**
 * Agents never receive a database client or unrestricted tools. The manager
 * owns tool selection and policy enforcement.
 */
export const coreNavigatorAgent = new Agent({
  name: "MapAble CareOS Core Navigator",
  instructions:
    "Provide plain-language, non-clinical explanations. Never make bookings, clinical decisions, eligibility decisions, or claims about unverified facts.",
});
