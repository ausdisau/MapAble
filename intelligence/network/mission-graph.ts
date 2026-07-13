import type { MapAbleModule } from "../types";
import type {
  CareOSMissionEdge,
  CareOSMissionNode,
  CareOSModuleReadResult,
} from "./types";

type AppointmentRecord = {
  id?: string;
  title?: string;
  startAt?: Date | string;
};

type CareRequestRecord = {
  id?: string;
  title?: string;
  status?: string;
  preferredDate?: Date | string | null;
  linkedTransportRequired?: boolean;
};

type TransportRecord = {
  id?: string;
  status?: string;
  scheduledStart?: Date | string;
};

type AccessRecord = {
  id?: string;
  name?: string;
  suburb?: string | null;
  confidence?: number | null;
};

type InvoiceRecord = {
  id?: string;
  status?: string;
  serviceType?: string;
  totalCents?: number;
};

function nodeStatusFor(result: CareOSModuleReadResult): CareOSMissionNode["status"] {
  if (result.status === "disabled") return "disabled";
  if (result.status === "not_authorised" || result.status === "consent_required") {
    return "not_authorised";
  }
  if (result.status === "available") return "available";
  if (result.status === "empty") return "missing";
  return "needs_review";
}

function firstItem<T>(result: CareOSModuleReadResult | undefined): T | null {
  return (result?.items[0] as T | undefined) ?? null;
}

function toISOString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function resultFor(
  results: CareOSModuleReadResult[],
  module: MapAbleModule
): CareOSModuleReadResult {
  return (
    results.find((result) => result.module === module) ?? {
      module,
      status: "unavailable",
      items: [],
    }
  );
}

export function buildCareOSMissionGraph(params: {
  goal: string;
  results: CareOSModuleReadResult[];
}): { nodes: CareOSMissionNode[]; edges: CareOSMissionEdge[] } {
  const core = resultFor(params.results, "core");
  const care = resultFor(params.results, "care");
  const transport = resultFor(params.results, "transport");
  const access = resultFor(params.results, "access");
  const payments = resultFor(params.results, "payments");

  const appointment = firstItem<AppointmentRecord>(core);
  const careRequest = firstItem<CareRequestRecord>(care);
  const transportRecord = firstItem<TransportRecord>(transport);
  const accessRecord = firstItem<AccessRecord>(access);
  const invoice = firstItem<InvoiceRecord>(payments);

  const nodes: CareOSMissionNode[] = [
    {
      id: "mission-goal",
      type: "goal",
      label: params.goal,
      status: "confirmed",
      sourceModule: "core",
      recordId: null,
      startsAt: null,
      details: "Participant-stated goal for this request.",
      evidence: ["participant_input"],
    },
    {
      id: "mission-appointment",
      type: "appointment",
      label: appointment?.title ?? "Appointment or activity",
      status: appointment ? "available" : nodeStatusFor(core),
      sourceModule: "core",
      recordId: appointment?.id ?? null,
      startsAt: toISOString(appointment?.startAt),
      details: appointment
        ? "Upcoming calendar record available for coordination."
        : "No upcoming appointment was available to anchor this mission.",
      evidence: appointment ? ["calendar_record"] : [],
    },
    {
      id: "mission-care",
      type: "care_support",
      label: careRequest?.title ?? "Care and support coverage",
      status: careRequest ? "available" : nodeStatusFor(care),
      sourceModule: "care",
      recordId: careRequest?.id ?? null,
      startsAt: toISOString(careRequest?.preferredDate),
      details: careRequest
        ? `Care request status: ${careRequest.status ?? "unknown"}.`
        : "No care request was available for this mission.",
      evidence: careRequest ? ["care_request_record"] : [],
    },
    {
      id: "mission-transport",
      type: "transport",
      label: "Accessible transport",
      status: transportRecord ? "available" : nodeStatusFor(transport),
      sourceModule: "transport",
      recordId: transportRecord?.id ?? null,
      startsAt: toISOString(transportRecord?.scheduledStart),
      details: transportRecord
        ? `Transport status: ${transportRecord.status ?? "unknown"}.`
        : "No transport record was available for this mission.",
      evidence: transportRecord ? ["transport_record"] : [],
    },
    {
      id: "mission-access",
      type: "accessibility",
      label: accessRecord?.name ?? "Destination accessibility evidence",
      status: accessRecord ? "available" : nodeStatusFor(access),
      sourceModule: "access",
      recordId: accessRecord?.id ?? null,
      startsAt: null,
      details: accessRecord
        ? `${accessRecord.suburb ? `${accessRecord.suburb}. ` : ""}Evidence confidence: ${
            typeof accessRecord.confidence === "number"
              ? `${Math.round(accessRecord.confidence * 100)}%`
              : "not recorded"
          }.`
        : "No destination accessibility record was available.",
      evidence: accessRecord ? ["published_access_record"] : [],
    },
  ];

  if (params.results.some((result) => result.module === "payments")) {
    nodes.push({
      id: "mission-funding",
      type: "funding",
      label: invoice?.serviceType ?? "Funding and invoice context",
      status: invoice ? "available" : nodeStatusFor(payments),
      sourceModule: "payments",
      recordId: invoice?.id ?? null,
      startsAt: null,
      details: invoice
        ? `Invoice status: ${invoice.status ?? "unknown"}. No payment action was taken.`
        : "No invoice context was available for this mission.",
      evidence: invoice ? ["invoice_record"] : [],
    });
  }

  const edges: CareOSMissionEdge[] = [
    { from: "mission-goal", to: "mission-appointment", relationship: "requires" },
    { from: "mission-goal", to: "mission-care", relationship: "supports" },
    { from: "mission-goal", to: "mission-transport", relationship: "requires" },
    { from: "mission-transport", to: "mission-access", relationship: "validated_by" },
  ];

  if (careRequest?.linkedTransportRequired) {
    edges.push({
      from: "mission-care",
      to: "mission-transport",
      relationship: "depends_on",
    });
  }

  if (nodes.some((node) => node.id === "mission-funding")) {
    edges.push({
      from: "mission-goal",
      to: "mission-funding",
      relationship: "reviewed_by",
    });
  }

  return { nodes, edges };
}
