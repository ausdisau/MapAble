import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";

import { getMapAbleIntelligenceConfig } from "./config";
import { buildSessionConsent } from "./consent/session-consent";
import type {
  PlatformBrief,
  PlatformBriefRequest,
  PlatformModuleBrief,
} from "./core-types";
import {
  executeIntelligenceReadTool,
  IntelligenceToolAccessError,
  type IntelligenceToolName,
} from "./tools/registry";
import type { MapAbleModule } from "./types";

type ModuleSpec = {
  tool?: IntelligenceToolName;
  input?: unknown;
  nonAiPath: string;
  availableSummary: (items: unknown[]) => string;
  highlight: (item: unknown) => string;
};

const MODULE_SPECS: Record<MapAbleModule, ModuleSpec> = {
  core: {
    tool: "read_upcoming_appointments",
    input: { days: 30 },
    nonAiPath: "/dashboard/calendar",
    availableSummary: (items) =>
      items.length === 0
        ? "No upcoming appointments were found in the next 30 days."
        : `${items.length} upcoming appointment${items.length === 1 ? "" : "s"} found.`,
    highlight: (item) => {
      const event = item as { title?: string; startAt?: Date | string };
      const when = event.startAt ? new Date(event.startAt).toLocaleString("en-AU") : "time unavailable";
      return `${event.title ?? "Appointment"}, ${when}`;
    },
  },
  care: {
    tool: "read_care_requests",
    input: { limit: 5 },
    nonAiPath: "/care/bookings",
    availableSummary: (items) =>
      items.length === 0
        ? "No recent care requests were found."
        : `${items.length} recent care request${items.length === 1 ? "" : "s"} found.`,
    highlight: (item) => {
      const request = item as { title?: string; status?: string };
      return `${request.title ?? "Care request"}: ${request.status ?? "status unavailable"}`;
    },
  },
  transport: {
    tool: "read_transport_trips",
    input: {},
    nonAiPath: "/dashboard/transport",
    availableSummary: (items) =>
      items.length === 0
        ? "No transport requests were found."
        : `${items.length} transport record${items.length === 1 ? "" : "s"} found.`,
    highlight: (item) => {
      const record = item as { trip?: { status?: string; scheduledStart?: string } };
      return `Trip ${record.trip?.status ?? "status unavailable"}${
        record.trip?.scheduledStart
          ? `, ${new Date(record.trip.scheduledStart).toLocaleString("en-AU")}`
          : ""
      }`;
    },
  },
  jobs: {
    tool: "read_public_jobs",
    input: { limit: 5 },
    nonAiPath: "/jobs",
    availableSummary: (items) =>
      items.length === 0
        ? "No published jobs were found."
        : `${items.length} published job${items.length === 1 ? "" : "s"} found.`,
    highlight: (item) => {
      const job = item as { title?: string; location?: string | null };
      return `${job.title ?? "Job"}${job.location ? `, ${job.location}` : ""}`;
    },
  },
  access: {
    tool: "read_access_places",
    input: { limit: 5 },
    nonAiPath: "/access",
    availableSummary: (items) =>
      items.length === 0
        ? "No published accessibility places were found."
        : `${items.length} accessibility place${items.length === 1 ? "" : "s"} found.`,
    highlight: (item) => {
      const place = item as { name?: string; suburb?: string | null; confidence?: number | null };
      const confidence = typeof place.confidence === "number"
        ? `, ${Math.round(place.confidence * 100)}% confidence`
        : "";
      return `${place.name ?? "Place"}${place.suburb ? `, ${place.suburb}` : ""}${confidence}`;
    },
  },
  moves: {
    nonAiPath: "/moves",
    availableSummary: () => "MapAble Moves intelligence is awaiting a governed read service.",
    highlight: () => "No Moves records were read.",
  },
  foods: {
    nonAiPath: "/foods",
    availableSummary: () => "MapAble Foods intelligence is awaiting a governed read service.",
    highlight: () => "No Foods records were read.",
  },
  payments: {
    tool: "read_invoices",
    input: {},
    nonAiPath: "/dashboard/billing",
    availableSummary: (items) =>
      items.length === 0
        ? "No invoices were found."
        : `${items.length} invoice${items.length === 1 ? "" : "s"} found. No payment action was taken.`,
    highlight: (item) => {
      const invoice = item as { status?: string; totalCents?: number; serviceType?: string };
      const amount = typeof invoice.totalCents === "number"
        ? new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(invoice.totalCents / 100)
        : "amount unavailable";
      return `${invoice.serviceType ?? "Invoice"}: ${amount}, ${invoice.status ?? "status unavailable"}`;
    },
  },
};

function unavailableBrief(
  module: MapAbleModule,
  status: PlatformModuleBrief["status"],
  summary: string
): PlatformModuleBrief {
  return {
    module,
    status,
    summary,
    itemCount: 0,
    highlights: [],
    evidence: [],
    nonAiPath: MODULE_SPECS[module].nonAiPath,
  };
}

async function buildModuleBrief(params: {
  module: MapAbleModule;
  user: CurrentUser;
  consentScopes: ReturnType<typeof buildSessionConsent>;
}): Promise<PlatformModuleBrief> {
  const config = getMapAbleIntelligenceConfig();
  const spec = MODULE_SPECS[params.module];

  if (!config.modules[params.module]) {
    return unavailableBrief(
      params.module,
      "disabled",
      `${params.module} intelligence is disabled. The standard service remains available.`
    );
  }

  if (!spec.tool) {
    return unavailableBrief(params.module, "unavailable", spec.availableSummary([]));
  }

  try {
    const result = await executeIntelligenceReadTool(spec.tool, spec.input ?? {}, {
      user: params.user,
      consentScopes: params.consentScopes,
    });
    const items = Array.isArray(result) ? result : [];

    return {
      module: params.module,
      status: "available",
      summary: spec.availableSummary(items),
      itemCount: items.length,
      highlights: items.slice(0, 3).map(spec.highlight),
      evidence: items.length > 0
        ? [{ label: "MapAble application record", source: spec.tool, confidence: 1 }]
        : [],
      nonAiPath: spec.nonAiPath,
    };
  } catch (error) {
    if (error instanceof IntelligenceToolAccessError) {
      if (error.code === "PERMISSION_DENIED") {
        return unavailableBrief(
          params.module,
          "not_authorised",
          "Your current account role does not permit this information to be read."
        );
      }
      if (error.code === "CONSENT_REQUIRED") {
        return unavailableBrief(
          params.module,
          "consent_required",
          "This area was not authorised for the current brief."
        );
      }
    }

    console.error(`[mapable-intelligence-${params.module}]`, error);
    return unavailableBrief(
      params.module,
      "unavailable",
      "This area could not be read. Use the standard service instead."
    );
  }
}

export async function buildPlatformBrief(params: {
  user: CurrentUser;
  request: PlatformBriefRequest;
}): Promise<PlatformBrief> {
  const config = getMapAbleIntelligenceConfig();
  const uniqueModules = [...new Set(params.request.modules)];
  const consentScopes = buildSessionConsent({
    modules: uniqueModules,
    includeAccessibilityProfile: params.request.includeAccessibilityProfile,
    explicitScopes: params.request.consentScopes,
  });

  const modules = await Promise.all(
    uniqueModules.map((module) =>
      buildModuleBrief({ module, user: params.user, consentScopes })
    )
  );

  if (config.auditEnabled) {
    await createAuditEvent({
      actorUserId: params.user.id,
      actorRole: params.user.primaryRole,
      action: "intelligence.platform_brief.generated",
      entityType: "MapAbleIntelligenceBrief",
      participantId: params.user.id,
      metadata: {
        modules: uniqueModules,
        profileIncluded: params.request.includeAccessibilityProfile,
        statuses: modules.map((module) => ({ module: module.module, status: module.status })),
        writeActionsEnabled: config.writeActionsEnabled,
      },
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    participantId: params.user.id,
    modules,
    notices: [
      "This brief is read-only. It did not book, submit, publish, disclose or pay anything.",
      "Each MapAble area was checked against your account permissions and request-scoped consent.",
      "AI-generated explanations are advisory. Application records remain the source of truth.",
    ],
    modelReasoningUsed: false,
    writeActionsEnabled: config.writeActionsEnabled,
    nonAiPath: { label: "Open the standard MapAble dashboard", href: "/dashboard" },
  };
}
