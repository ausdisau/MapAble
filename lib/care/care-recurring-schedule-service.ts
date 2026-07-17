/**
 * Recurring Care schedules for a booking.
 * Agreement SoT remains CareServiceAgreement — schedule never stores agreement text.
 * Cancelling a materialised shift must not auto-cancel connected Transport (PR5).
 */

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import {
  CareAccessError,
  assertProviderOrgAccess,
} from "@/lib/care/access-control";
import { amendAccessibleServiceAgreement } from "@/lib/care/care-agreement-service";
import { createCareShiftFromRequest } from "@/lib/care/care-shift-service";
import { isCareRecurringSchedulesEnabled } from "@/lib/config/care-recurring";
import { prisma } from "@/lib/prisma";

export type CareRecurringScheduleView = {
  id: string;
  careBookingId: string;
  participantId: string;
  organisationId: string;
  frequency: "weekly" | "fortnightly";
  byWeekday: number[];
  startTimeLocal: string;
  endTimeLocal: string;
  timezone: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: "draft" | "active" | "paused" | "ended";
};

function assertFlag(): void {
  if (!isCareRecurringSchedulesEnabled()) {
    throw new Error("FEATURE_DISABLED");
  }
}

async function assertBookingAccess(
  actor: CurrentUser,
  booking: { participantId: string; organisationId: string },
): Promise<void> {
  if (isAdminRole(actor.primaryRole)) return;
  if (booking.participantId === actor.id) return;
  await assertProviderOrgAccess(actor, booking.organisationId);
}

function parseTimeLocal(value: string): { hours: number; minutes: number } {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!m) throw new Error("INVALID_TIME");
  return { hours: Number(m[1]), minutes: Number(m[2]) };
}

function toView(row: {
  id: string;
  careBookingId: string;
  participantId: string;
  organisationId: string;
  frequency: string;
  byWeekday: number[];
  startTimeLocal: string;
  endTimeLocal: string;
  timezone: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  status: string;
}): CareRecurringScheduleView {
  return {
    id: row.id,
    careBookingId: row.careBookingId,
    participantId: row.participantId,
    organisationId: row.organisationId,
    frequency: row.frequency as "weekly" | "fortnightly",
    byWeekday: row.byWeekday,
    startTimeLocal: row.startTimeLocal,
    endTimeLocal: row.endTimeLocal,
    timezone: row.timezone,
    effectiveFrom: row.effectiveFrom.toISOString(),
    effectiveTo: row.effectiveTo?.toISOString(),
    status: row.status as CareRecurringScheduleView["status"],
  };
}

/** ISO weekday: 1=Mon .. 7=Sun */
function isoWeekday(d: Date): number {
  const day = d.getUTCDay();
  return day === 0 ? 7 : day;
}

function dateKeyUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function createCareRecurringSchedule(input: {
  careBookingId: string;
  actor: CurrentUser;
  frequency: "weekly" | "fortnightly";
  byWeekday: number[];
  startTimeLocal: string;
  endTimeLocal: string;
  timezone?: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
}): Promise<CareRecurringScheduleView> {
  assertFlag();
  parseTimeLocal(input.startTimeLocal);
  parseTimeLocal(input.endTimeLocal);
  if (
    input.byWeekday.length === 0 ||
    input.byWeekday.some((d) => d < 1 || d > 7)
  ) {
    throw new Error("INVALID_WEEKDAY");
  }

  const booking = await prisma.careBooking.findUnique({
    where: { id: input.careBookingId },
  });
  if (!booking) throw new Error("NOT_FOUND");
  try {
    await assertBookingAccess(input.actor, booking);
  } catch (e) {
    if (e instanceof CareAccessError) throw new Error("FORBIDDEN");
    throw e;
  }

  const created = await prisma.careRecurringSchedule.create({
    data: {
      careBookingId: booking.id,
      participantId: booking.participantId,
      organisationId: booking.organisationId,
      frequency: input.frequency,
      byWeekday: input.byWeekday,
      startTimeLocal: input.startTimeLocal,
      endTimeLocal: input.endTimeLocal,
      timezone: input.timezone ?? "Australia/Sydney",
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo,
      status: "draft",
    },
  });

  await createAuditEvent({
    actorUserId: input.actor.id,
    action: "care_recurring_schedule.created",
    entityType: "CareRecurringSchedule",
    entityId: created.id,
    organisationId: booking.organisationId,
    participantId: booking.participantId,
    metadata: { frequency: created.frequency, status: created.status },
  });

  return toView(created);
}

export async function activateCareRecurringSchedule(input: {
  scheduleId: string;
  actor: CurrentUser;
  /** When true, bumps CareServiceAgreement version (still booking-scoped SoT). */
  amendAgreement?: boolean;
  agreementReason?: string;
}): Promise<CareRecurringScheduleView> {
  assertFlag();
  const schedule = await prisma.careRecurringSchedule.findUnique({
    where: { id: input.scheduleId },
    include: { careBooking: true },
  });
  if (!schedule) throw new Error("NOT_FOUND");
  try {
    await assertBookingAccess(input.actor, schedule.careBooking);
  } catch (e) {
    if (e instanceof CareAccessError) throw new Error("FORBIDDEN");
    throw e;
  }

  const updated = await prisma.careRecurringSchedule.update({
    where: { id: schedule.id },
    data: { status: "active" },
  });

  if (input.amendAgreement) {
    await amendAccessibleServiceAgreement({
      careBookingId: schedule.careBookingId,
      actor: input.actor,
      reason:
        input.agreementReason ??
        "Recurring schedule activated — review updated support times.",
    });
  }

  await createAuditEvent({
    actorUserId: input.actor.id,
    action: "care_recurring_schedule.activated",
    entityType: "CareRecurringSchedule",
    entityId: updated.id,
    organisationId: schedule.organisationId,
    participantId: schedule.participantId,
  });

  return toView(updated);
}

export async function addCareScheduleException(input: {
  scheduleId: string;
  actor: CurrentUser;
  occurrenceDate: Date;
  type: "skip" | "reschedule";
  newStartAt?: Date;
  newEndAt?: Date;
  reason?: string;
}): Promise<{ id: string; type: string; occurrenceDate: string }> {
  assertFlag();
  if (input.type === "reschedule" && (!input.newStartAt || !input.newEndAt)) {
    throw new Error("RESCHEDULE_REQUIRES_TIMES");
  }
  const schedule = await prisma.careRecurringSchedule.findUnique({
    where: { id: input.scheduleId },
    include: { careBooking: true },
  });
  if (!schedule) throw new Error("NOT_FOUND");
  try {
    await assertBookingAccess(input.actor, schedule.careBooking);
  } catch (e) {
    if (e instanceof CareAccessError) throw new Error("FORBIDDEN");
    throw e;
  }

  const exception = await prisma.careRecurringScheduleException.create({
    data: {
      scheduleId: schedule.id,
      occurrenceDate: input.occurrenceDate,
      type: input.type,
      newStartAt: input.newStartAt,
      newEndAt: input.newEndAt,
      reason: input.reason,
    },
  });

  await createAuditEvent({
    actorUserId: input.actor.id,
    action: "care_recurring_schedule.exception_added",
    entityType: "CareRecurringScheduleException",
    entityId: exception.id,
    organisationId: schedule.organisationId,
    participantId: schedule.participantId,
    metadata: { type: exception.type, scheduleId: schedule.id },
  });

  return {
    id: exception.id,
    type: exception.type,
    occurrenceDate: dateKeyUTC(exception.occurrenceDate),
  };
}

/**
 * Materialise upcoming shifts for an active schedule within a horizon (days).
 * Idempotent per (scheduleId, occurrenceDate).
 */
export async function materialiseCareScheduleOccurrences(input: {
  scheduleId: string;
  actor: CurrentUser;
  horizonDays?: number;
}): Promise<{ createdShiftIds: string[]; skippedDates: string[] }> {
  assertFlag();
  const horizon = Math.min(Math.max(input.horizonDays ?? 14, 1), 60);
  const schedule = await prisma.careRecurringSchedule.findUnique({
    where: { id: input.scheduleId },
    include: {
      careBooking: true,
      exceptions: true,
      shifts: { select: { occurrenceDate: true } },
    },
  });
  if (!schedule) throw new Error("NOT_FOUND");
  if (schedule.status !== "active") throw new Error("INVALID_STATE");
  try {
    await assertBookingAccess(input.actor, schedule.careBooking);
  } catch (e) {
    if (e instanceof CareAccessError) throw new Error("FORBIDDEN");
    throw e;
  }

  const startParts = parseTimeLocal(schedule.startTimeLocal);
  const endParts = parseTimeLocal(schedule.endTimeLocal);
  const existing = new Set(
    schedule.shifts
      .map((s) => (s.occurrenceDate ? dateKeyUTC(s.occurrenceDate) : null))
      .filter((x): x is string => Boolean(x)),
  );
  const exceptionsByDate = new Map(
    schedule.exceptions.map((e) => [dateKeyUTC(e.occurrenceDate), e]),
  );

  const createdShiftIds: string[] = [];
  const skippedDates: string[] = [];
  const cursor = new Date(schedule.effectiveFrom);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date();
  end.setUTCDate(end.getUTCDate() + horizon);
  end.setUTCHours(23, 59, 59, 999);

  let weekIndex = 0;
  let lastWeekStart = "";

  for (
    let d = new Date(cursor);
    d <= end;
    d = new Date(d.getTime() + 24 * 60 * 60 * 1000)
  ) {
    if (schedule.effectiveTo && d > schedule.effectiveTo) break;
    const key = dateKeyUTC(d);
    const weekStart = (() => {
      const copy = new Date(d);
      const iso = isoWeekday(copy);
      copy.setUTCDate(copy.getUTCDate() - (iso - 1));
      return dateKeyUTC(copy);
    })();
    if (weekStart !== lastWeekStart) {
      if (lastWeekStart) weekIndex += 1;
      lastWeekStart = weekStart;
    }
    if (
      schedule.frequency === "fortnightly" &&
      weekIndex % 2 === 1
    ) {
      continue;
    }
    if (!schedule.byWeekday.includes(isoWeekday(d))) continue;

    const exception = exceptionsByDate.get(key);
    if (exception?.type === "skip") {
      skippedDates.push(key);
      continue;
    }
    if (existing.has(key)) {
      skippedDates.push(key);
      continue;
    }

    let startAt = new Date(
      Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate(),
        startParts.hours,
        startParts.minutes,
        0,
        0,
      ),
    );
    let endAt = new Date(
      Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate(),
        endParts.hours,
        endParts.minutes,
        0,
        0,
      ),
    );
    if (exception?.type === "reschedule" && exception.newStartAt && exception.newEndAt) {
      startAt = exception.newStartAt;
      endAt = exception.newEndAt;
    }

    const shift = await createCareShiftFromRequest({
      careRequestId: schedule.careBooking.careRequestId,
      organisationId: schedule.organisationId,
      startAt,
      endAt,
      location: schedule.careBooking.location ?? undefined,
      careBookingId: schedule.careBookingId,
      createdById: input.actor.id,
      recurringScheduleId: schedule.id,
      occurrenceDate: new Date(`${key}T00:00:00.000Z`),
    });
    createdShiftIds.push(shift.id);
    existing.add(key);
  }

  return { createdShiftIds, skippedDates };
}

/**
 * Record a shift cancellation with recovery hook.
 * Does NOT cancel connected Transport — Continuity owns that (PR5).
 */
export async function cancelCareShiftWithRecoveryHook(input: {
  careShiftId: string;
  actor: CurrentUser;
  reason: string;
}): Promise<{
  shiftId: string;
  status: string;
  cancellationId: string;
  transportAutoCancelled: false;
  recoveryHint: string;
}> {
  const shift = await prisma.careShift.findUnique({
    where: { id: input.careShiftId },
  });
  if (!shift) throw new Error("NOT_FOUND");
  try {
    await assertBookingAccess(input.actor, {
      participantId: shift.participantId,
      organisationId: shift.organisationId,
    });
  } catch (e) {
    if (e instanceof CareAccessError) throw new Error("FORBIDDEN");
    throw e;
  }

  const cancellation = await prisma.careShiftCancellation.create({
    data: {
      careShiftId: shift.id,
      reason: input.reason,
      cancelledById: input.actor.id,
    },
  });

  await prisma.careShift.update({
    where: { id: shift.id },
    data: { status: "cancelled" },
  });

  await createAuditEvent({
    actorUserId: input.actor.id,
    action: "care_shift.cancelled",
    entityType: "CareShift",
    entityId: shift.id,
    organisationId: shift.organisationId,
    participantId: shift.participantId,
    metadata: {
      cancellationId: cancellation.id,
      transportAutoCancelled: false,
      recoveryRequired: true,
    },
  });

  return {
    shiftId: shift.id,
    status: "cancelled",
    cancellationId: cancellation.id,
    transportAutoCancelled: false,
    recoveryHint:
      "Care cancellation recorded. Connected Transport is not auto-cancelled; participant-controlled recovery is required.",
  };
}

export async function listCareRecurringSchedulesForBooking(
  careBookingId: string,
  actor: CurrentUser,
): Promise<CareRecurringScheduleView[]> {
  assertFlag();
  const booking = await prisma.careBooking.findUnique({
    where: { id: careBookingId },
  });
  if (!booking) throw new Error("NOT_FOUND");
  try {
    await assertBookingAccess(actor, booking);
  } catch (e) {
    if (e instanceof CareAccessError) throw new Error("FORBIDDEN");
    throw e;
  }
  const rows = await prisma.careRecurringSchedule.findMany({
    where: { careBookingId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toView);
}
