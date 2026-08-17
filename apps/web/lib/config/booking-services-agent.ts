/** AI SDK ToolLoopAgent for auth-scoped booking retrieval. */

export const bookingServicesAgentConfig = {
  enabled: process.env.BOOKING_SERVICES_AGENT_ENABLED === "true",
  maxSteps: Math.min(
    Math.max(Number(process.env.BOOKING_SERVICES_AGENT_MAX_STEPS ?? "6"), 1),
    12,
  ),
};

export function isBookingServicesAgentConfigured(): boolean {
  return process.env.BOOKING_SERVICES_AGENT_ENABLED === "true";
}
