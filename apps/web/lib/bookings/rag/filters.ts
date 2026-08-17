import type { BookingRecordType, BookingSearchFilters } from "./types";

const CARE_STATUS_WORDS = [
  "pending",
  "accepted",
  "declined",
  "assigned",
  "progress",
  "completed",
  "cancelled",
  "disputed",
];

const TRANSPORT_STATUS_WORDS = [
  "draft",
  "requested",
  "confirmed",
  "transit",
  "cancelled",
  "disputed",
];

/**
 * Extract lightweight structured filters from NL query text.
 * Complements TF search — does not replace auth scoping.
 */
export function parseBookingSearchFilters(query: string): BookingSearchFilters {
  const q = query.toLowerCase();
  const filters: BookingSearchFilters = {};

  if (/\b(care|support\s*worker|shift|roster)\b/.test(q)) {
    filters.recordType = "care";
  } else if (/\b(transport|ride|trip|pickup|wheelchair)\b/.test(q)) {
    filters.recordType = "transport";
  } else if (/\b(bundle|combined|care\s*\+\s*transport)\b/.test(q)) {
    filters.recordType = "bundle";
  }

  for (const word of CARE_STATUS_WORDS) {
    if (q.includes(word)) {
      filters.status = word === "assigned" ? "worker_assigned" : word;
      if (word === "progress") filters.status = "in_progress";
      break;
    }
  }

  if (!filters.status) {
    for (const word of TRANSPORT_STATUS_WORDS) {
      if (q.includes(word)) {
        filters.status = word;
        break;
      }
    }
  }

  if (/\b(this\s*week|next\s*week)\b/.test(q)) {
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const start = new Date(now);
    start.setDate(now.getDate() + mondayOffset);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + (q.includes("next") ? 13 : 6));
    end.setHours(23, 59, 59, 999);
    filters.fromDate = q.includes("next") ? new Date(start.getTime() + 7 * 86400000) : start;
    filters.toDate = end;
  }

  if (/\b(today|tomorrow)\b/.test(q)) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (q.includes("tomorrow")) {
      start.setDate(start.getDate() + 1);
    }
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    filters.fromDate = start;
    filters.toDate = end;
  }

  return filters;
}

export function matchesBookingFilters(
  snapshot: {
    recordType: BookingRecordType;
    status: string;
    scheduledStartAt: Date | null;
    organisationId: string | null;
  },
  filters: BookingSearchFilters,
): boolean {
  if (filters.recordType && snapshot.recordType !== filters.recordType) {
    return false;
  }
  if (filters.status && !snapshot.status.toLowerCase().includes(filters.status)) {
    return false;
  }
  if (filters.organisationId && snapshot.organisationId !== filters.organisationId) {
    return false;
  }
  if (filters.fromDate || filters.toDate) {
    const when = snapshot.scheduledStartAt;
    if (!when) return false;
    if (filters.fromDate && when < filters.fromDate) return false;
    if (filters.toDate && when > filters.toDate) return false;
  }
  return true;
}
