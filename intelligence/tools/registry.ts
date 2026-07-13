import { z } from "zod";

import { listCalendarEvents } from "@/lib/calendar/calendar-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { getMobilityPrefillForUser } from "@/lib/transport/profile-prefill-service";

export type IntelligenceToolContext = {
  user: CurrentUser;
};

export type IntelligenceToolDefinition<TInput, TOutput> = {
  name: string;
  description: string;
  mode: "read" | "draft" | "write";
  inputSchema: z.ZodType<TInput>;
  execute: (input: TInput, context: IntelligenceToolContext) => Promise<TOutput>;
};

export const readUpcomingAppointmentsTool: IntelligenceToolDefinition<
  { days: number },
  Awaited<ReturnType<typeof listCalendarEvents>>
> = {
  name: "read_upcoming_appointments",
  description: "Read the signed-in participant's upcoming calendar events.",
  mode: "read",
  inputSchema: z.object({ days: z.number().int().min(1).max(90).default(30) }),
  async execute(input, context) {
    const from = new Date();
    const to = new Date(from.getTime() + input.days * 24 * 60 * 60 * 1000);
    return listCalendarEvents({ participantId: context.user.id, from, to });
  },
};

export const readMobilityPreferencesTool: IntelligenceToolDefinition<
  Record<string, never>,
  Awaited<ReturnType<typeof getMobilityPrefillForUser>>
> = {
  name: "read_mobility_preferences",
  description: "Read participant-controlled transport accessibility preferences.",
  mode: "read",
  inputSchema: z.object({}),
  async execute(_input, context) {
    return getMobilityPrefillForUser(context.user);
  },
};

export const intelligenceToolRegistry = {
  read_upcoming_appointments: readUpcomingAppointmentsTool,
  read_mobility_preferences: readMobilityPreferencesTool,
} as const;

export type IntelligenceToolName = keyof typeof intelligenceToolRegistry;

export function assertReadOnlyTool(name: IntelligenceToolName) {
  const tool = intelligenceToolRegistry[name];
  if (tool.mode !== "read") {
    throw new Error(`INTELLIGENCE_WRITE_TOOL_BLOCKED:${name}`);
  }
  return tool;
}
