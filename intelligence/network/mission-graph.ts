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
  results