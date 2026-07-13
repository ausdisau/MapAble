import { z } from "zod";

import { listPublishedPlaces } from "@/lib/access-map/access-place-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { listInvoicesForUser } from "@/lib/billing-core/invoice-service";
import { listCalendarEvents } from "@/lib/calendar/calendar-service";
import { prisma } from "@/lib/prisma";
import { getMobilityPrefillForUser } from "@/lib/transport/profile-prefill-service";
import { listTransportTripsForUser } from "@/lib/transport/transport-trip-service";

import {
  hasSessionConsent,
  type IntelligenceSessionConsentScope,
} from "../consent/session-consent";
import type { MapAbleModule } from "../types";

export type IntelligenceToolContext = {
  user: CurrentUser;
  consentScopes: ReadonlySet<IntelligenceSessionConsentScope>;
};

export type IntelligenceToolMode = "read" | "draft" | "write" | "restricted";

export type IntelligenceToolDefinition<TInput, TOutput> = {
  name: string;
  module: MapAbleModule;
  description: string;
  mode: IntelligenceToolMode;
  inputSchema: z.ZodType<TInput>;
  requiredPermissions: Permission[];
  requiredConsent: IntelligenceSessionConsentScope[];
  execute: (input: TInput, context: IntelligenceToolContext) => Promise<TOutput>;
};

const emptyInput = z.object({});

export const intelligenceToolRegistry = {
  read_upcoming_appointments: {
    name: "read_upcoming_appointments",
    module: "core",
    description: "Read the signed-in participant's upcoming calendar events.",
    mode: "read",
    inputSchema: z.object({ days: z.number().int().min(1).max(90).default(30) }),
    requiredPermissions: ["calendar:read:self"],
    requiredConsent: ["core.summary"],
    async execute(input: { days: number }, context: IntelligenceToolContext) {
      const from = new Date();
      const to = new Date(from.getTime() + input.days * 86_400_000);
      return listCalendarEvents({ participantId: context.user.id, from, to });
    },
  },
  read_mobility_preferences: {
    name: "read_mobility_preferences",
    module: "transport",
    description: "Read participant-controlled transport accessibility preferences.",
    mode: "read",
    inputSchema: emptyInput,
    requiredPermissions: ["accessibility:read:self"],
    requiredConsent: ["transport.summary", "profile.accessibility"],
    async execute(_input: Record<string, never>, context: IntelligenceToolContext) {
      return getMobilityPrefillForUser(context.user);
    },
  },
  read_care_requests: {
    name: "read_care_requests",
    module: "care",
    description: "Read the participant's recent care requests without changing them.",
    mode: "read",
    inputSchema: z.object({ limit: z.number().int().min(1).max(20).default(5) }),
    requiredPermissions: ["care:read:self"],
    requiredConsent: ["care.summary"],
    async execute(input: { limit: number }, context: IntelligenceToolContext) {
      return prisma.careRequest.findMany({
        where: { participantId: context.user.id },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        select: {
          id: true,
          title: true,
          status: true,
          preferredDate: true,
          linkedTransportRequired: true,
        },
      });
    },
  },
  read_transport_trips: {
    name: "read_transport_trips",
    module: "transport",
    description: "Read the participant's transport requests and current status.",
    mode: "read",
    inputSchema: emptyInput,
    requiredPermissions: ["transport:read:self"],
    requiredConsent: ["transport.summary"],
    async execute(_input: Record<string, never>, context: IntelligenceToolContext) {
      return listTransportTripsForUser(context.user);
    },
  },
  read_public_jobs: {
    name: "read_public_jobs",
    module: "jobs",
    description: "Read currently published jobs. No candidate scoring is performed.",
    mode: "read",
    inputSchema: z.object({ limit: z.number().int().min(1).max(20).default(5) }),
    requiredPermissions: ["jobs:read:public"],
    requiredConsent: ["jobs.summary"],
    async execute(input: { limit: number }) {
      return prisma.job.findMany({
        where: { status: "published" },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        select: {
          id: true,
          title: true,
          location: true,
          employmentType: true,
          createdAt: true,
        },
      });
    },
  },
  read_access_places: {
    name: "read_access_places",
    module: "access",
    description: "Read published accessibility place records and their evidence confidence.",
    mode: "read",
    inputSchema: z.object({ limit: z.number().int().min(1).max(20).default(5) }),
    requiredPermissions: [],
    requiredConsent: ["access.summary"],
    async execute(input: { limit: number }) {
      const places = await listPublishedPlaces(input.limit);
      return places.map((place) => ({
        id: place.id,
        name: place.name,
        suburb: place.suburb,
        confidence: place.confidence,
        featureCount: place.features.length,
        reviewCount: place._count.reviews,
      }));
    },
  },
  read_invoices: {
    name: "read_invoices",
    module: "payments",
    description: "Read invoice summaries. The tool cannot approve, submit, claim or pay an invoice.",
    mode: "read",
    inputSchema: emptyInput,
    requiredPermissions: ["invoice:read:self"],
    requiredConsent: ["payments.summary"],
    async execute(_input: Record<string, never>, context: IntelligenceToolContext) {
      return listInvoicesForUser(context.user.id);
    },
  },
} as const;

export type IntelligenceToolName = keyof typeof intelligenceToolRegistry;

export class IntelligenceToolAccessError extends Error {
  constructor(
    public readonly code:
      | "TOOL_NOT_READ_ONLY"
      | "PERMISSION_DENIED"
      | "CONSENT_REQUIRED"
  ) {
    super(code);
  }
}

export async function executeIntelligenceReadTool(
  name: IntelligenceToolName,
  rawInput: unknown,
  context: IntelligenceToolContext
): Promise<unknown> {
  const tool = intelligenceToolRegistry[name] as unknown as IntelligenceToolDefinition<
    unknown,
    unknown
  >;
  if (tool.mode !== "read") {
    throw new IntelligenceToolAccessError("TOOL_NOT_READ_ONLY");
  }

  const authorised = tool.requiredPermissions.every((permission) =>
    hasPermission(context.user.primaryRole, permission)
  );
  if (!authorised) throw new IntelligenceToolAccessError("PERMISSION_DENIED");
  if (!hasSessionConsent(context.consentScopes, tool.requiredConsent)) {
    throw new IntelligenceToolAccessError("CONSENT_REQUIRED");
  }

  return tool.execute(tool.inputSchema.parse(rawInput), context);
}

export function listIntelligenceToolsForModule(module: MapAbleModule) {
  return Object.values(intelligenceToolRegistry).filter(
    (tool) => tool.module === module
  );
}
