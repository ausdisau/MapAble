import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

import { buildBookingRAGScope, canViewSensitiveBookingFields } from "./scope";
import type {
  BookingEventSnapshot,
  BookingRecordType,
  BookingRAGScope,
  BookingSegmentSnapshot,
  BookingServiceLogSnapshot,
  BookingSnapshot,
} from "./types";

const DEFAULT_LIMIT = 100;

function formatSchedule(start: Date | null, end: Date | null): string {
  if (!start) return "Schedule not set";
  const startStr = start.toISOString().slice(0, 16).replace("T", " ");
  if (!end) return startStr;
  return `${startStr} – ${end.toISOString().slice(11, 16)}`;
}

function buildSearchText(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(" \n ").toLowerCase();
}

async function loadCareSnapshots(
  scope: BookingRAGScope,
  limit: number,
): Promise<BookingSnapshot[]> {
  let where: Record<string, unknown> = {};
  if (scope.participantId) {
    where = { participantId: scope.participantId };
  } else if (scope.organisationIds?.length) {
    where = { organisationId: { in: scope.organisationIds } };
  }

  const rows = await prisma.careBooking.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      organisation: { select: { id: true, name: true } },
      careRequest: { select: { title: true, status: true } },
      events: { orderBy: { createdAt: "desc" }, take: 10 },
      serviceLogs: {
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          status: true,
          notes: true,
          durationMinutes: true,
          submittedAt: true,
          confirmedAt: true,
          disputedAt: true,
        },
      },
    },
  });

  return rows.map((row) => {
    const includeSensitive = canViewSensitiveBookingFields(scope, {
      participantId: row.participantId,
      organisationId: row.organisationId,
    });

    const events: BookingEventSnapshot[] = row.events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      title: e.title,
      createdAt: e.createdAt,
    }));

    const serviceLogs: BookingServiceLogSnapshot[] = row.serviceLogs.map((log) => ({
      id: log.id,
      status: log.status,
      notes: includeSensitive ? log.notes : log.notes ? "[redacted]" : null,
      durationMinutes: log.durationMinutes,
      submittedAt: log.submittedAt,
      confirmedAt: log.confirmedAt,
      disputedAt: log.disputedAt,
    }));

    const title =
      row.careRequest?.title?.trim() || `Care booking (${row.status})`;
    const summary = [
      `Care booking ${row.status}`,
      row.organisation.name,
      row.location,
      formatSchedule(row.scheduledStartAt, row.scheduledEndAt),
      row.careRequest?.status ? `Request: ${row.careRequest.status}` : null,
      ...events.map((e) => e.title),
      ...serviceLogs.map((l) => `log ${l.status} ${l.notes ?? ""}`),
    ].join(". ");

    return {
      id: row.id,
      recordType: "care" as BookingRecordType,
      status: row.status,
      participantId: row.participantId,
      organisationId: row.organisationId,
      organisationName: row.organisation.name,
      scheduledStartAt: row.scheduledStartAt,
      scheduledEndAt: row.scheduledEndAt,
      location: row.location,
      title,
      summary,
      searchText: buildSearchText([
        title,
        row.status,
        row.organisation.name,
        row.location,
        ...events.map((e) => `${e.eventType} ${e.title}`),
        ...serviceLogs.map((l) => `${l.status} ${l.notes}`),
      ]),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      events,
      serviceLogs,
      segments: [],
      includeSensitiveFields: includeSensitive,
    };
  });
}

async function loadTransportSnapshots(
  scope: BookingRAGScope,
  limit: number,
): Promise<BookingSnapshot[]> {
  let where: Record<string, unknown> = {};
  if (scope.participantId) {
    where = { participantId: scope.participantId };
  } else if (scope.organisationIds?.length) {
    where = { operatorOrganisationId: { in: scope.organisationIds } };
  }

  const rows = await prisma.transportBooking.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      operatorOrganisation: { select: { id: true, name: true } },
    },
  });

  return rows.map((row) => {
    const orgId = row.operatorOrganisationId;
    const includeSensitive = canViewSensitiveBookingFields(scope, {
      participantId: row.participantId,
      organisationId: orgId,
    });

    const mobilityNote = includeSensitive
      ? row.pickupNotes || row.dropoffNotes
      : row.pickupNotes || row.dropoffNotes
        ? "[access notes on file]"
        : null;

    const title = `Transport: ${row.pickupAddress} → ${row.dropoffAddress}`;
    const summary = [
      `Transport ${row.status}`,
      row.operatorOrganisation?.name,
      title,
      formatSchedule(row.pickupWindowStart, row.pickupWindowEnd ?? null),
      mobilityNote,
    ].join(". ");

    return {
      id: row.id,
      recordType: "transport" as BookingRecordType,
      status: row.status,
      participantId: row.participantId,
      organisationId: orgId,
      organisationName: row.operatorOrganisation?.name ?? null,
      scheduledStartAt: row.pickupWindowStart,
      scheduledEndAt: row.pickupWindowEnd,
      location: row.pickupAddress,
      title,
      summary,
      searchText: buildSearchText([
        title,
        row.status,
        row.pickupAddress,
        row.dropoffAddress,
        row.operatorOrganisation?.name,
        mobilityNote,
      ]),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      events: [],
      serviceLogs: [],
      segments: [],
      includeSensitiveFields: includeSensitive,
    };
  });
}

async function loadBundleSnapshots(
  scope: BookingRAGScope,
  limit: number,
): Promise<BookingSnapshot[]> {
  let where: Record<string, unknown> = {};
  if (scope.participantId) {
    where = { participantId: scope.participantId };
  } else if (scope.organisationIds?.length) {
    where = { assignedOrganisationId: { in: scope.organisationIds } };
  }

  const rows = await prisma.booking.findMany({
    where: {
      ...where,
      bookingType: "care_transport",
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      assignedOrganisation: { select: { id: true, name: true } },
      segments: { orderBy: { sortOrder: "asc" } },
      timelineEvents: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  return rows.map((row) => {
    const includeSensitive = canViewSensitiveBookingFields(scope, {
      participantId: row.participantId,
      organisationId: row.assignedOrganisationId,
    });

    const segments: BookingSegmentSnapshot[] = row.segments.map((s) => ({
      id: s.id,
      segmentType: s.segmentType,
      startTime: s.startTime,
      endTime: s.endTime,
      pickupAddress: s.pickupAddress,
      dropoffAddress: s.dropoffAddress,
    }));

    const events: BookingEventSnapshot[] = row.timelineEvents
      .filter((e) => !e.isAdminOnly || scope.isAdmin)
      .map((e) => ({
        id: e.id,
        eventType: e.eventType,
        title: e.title,
        createdAt: e.createdAt,
      }));

    const accessSummary = includeSensitive
      ? row.accessibilitySummary
      : row.accessibilitySummary
        ? "[accessibility summary on file]"
        : null;

    const title = `Care + transport bundle (${row.status})`;
    const summary = [
      title,
      row.assignedOrganisation?.name,
      formatSchedule(row.requestedStart, row.requestedEnd),
      row.careLocation,
      row.pickupAddress,
      row.dropoffAddress,
      accessSummary,
      ...segments.map((s) => s.segmentType),
      ...events.map((e) => e.title),
    ].join(". ");

    return {
      id: row.id,
      recordType: "bundle" as BookingRecordType,
      status: row.status,
      participantId: row.participantId,
      organisationId: row.assignedOrganisationId,
      organisationName: row.assignedOrganisation?.name ?? null,
      scheduledStartAt: row.requestedStart,
      scheduledEndAt: row.requestedEnd,
      location: row.careLocation ?? row.pickupAddress,
      title,
      summary,
      searchText: buildSearchText([
        title,
        row.status,
        row.assignedOrganisation?.name,
        row.careLocation,
        row.pickupAddress,
        row.dropoffAddress,
        row.participantNotes,
        accessSummary,
        ...segments.map((s) => `${s.segmentType} ${s.pickupAddress} ${s.dropoffAddress}`),
        ...events.map((e) => e.title),
      ]),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      events,
      serviceLogs: [],
      segments,
      includeSensitiveFields: includeSensitive,
    };
  });
}

export async function loadBookingSnapshotsForUser(
  user: CurrentUser,
  options?: { limit?: number },
): Promise<{ scope: BookingRAGScope; snapshots: BookingSnapshot[] }> {
  const scope = await buildBookingRAGScope(user);
  const limit = options?.limit ?? DEFAULT_LIMIT;

  const [care, transport, bundle] = await Promise.all([
    loadCareSnapshots(scope, limit),
    loadTransportSnapshots(scope, limit),
    loadBundleSnapshots(scope, limit),
  ]);

  const snapshots = [...care, ...transport, ...bundle].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );

  return { scope, snapshots };
}

export async function loadBookingSnapshotById(
  user: CurrentUser,
  bookingId: string,
  recordType?: BookingRecordType,
): Promise<BookingSnapshot | null> {
  const { snapshots } = await loadBookingSnapshotsForUser(user, { limit: 200 });
  const match = snapshots.find(
    (s) =>
      s.id === bookingId && (!recordType || s.recordType === recordType),
  );
  return match ?? null;
}
