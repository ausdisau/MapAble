import { phase4Config } from "@/lib/config/phase4";
import { prisma } from "@/lib/prisma";

export type MetricDefinition = { value: number; definition: string };

export type AnalyticsSummary =
  | { disabled: true }
  | {
      care: Record<string, MetricDefinition>;
      transport: Record<string, MetricDefinition>;
      incidents: Record<string, MetricDefinition>;
      billing: Record<string, MetricDefinition>;
    };

export async function getAnalyticsSummary(
  from?: Date,
  to?: Date
): Promise<AnalyticsSummary> {
  if (!phase4Config.adminAnalyticsEnabled) {
    return { disabled: true };
  }

  const dateFilter = from || to ? { createdAt: { gte: from, lte: to } } : {};

  const [
    careRequestsSubmitted,
    careShiftsCompleted,
    shiftsAwaitingApproval,
    timesheetsDisputed,
    transportRequested,
    transportCompleted,
    openCriticalIncidents,
    draftInvoices,
    preflightFailed,
    wavBookings,
  ] = await Promise.all([
    prisma.careRequest.count({
      where: { status: { not: "draft" }, ...dateFilter },
    }),
    prisma.careShift.count({ where: { status: "completed", ...dateFilter } }),
    prisma.careShift.count({
      where: { status: "awaiting_participant_approval" },
    }),
    prisma.timesheet.count({ where: { status: "disputed" } }),
    prisma.transportBooking.count({
      where: { status: { not: "draft" }, ...dateFilter },
    }),
    prisma.transportBooking.count({
      where: { status: "completed", ...dateFilter },
    }),
    prisma.incidentReport.count({
      where: {
        severity: "critical",
        status: { notIn: ["resolved", "closed"] },
      },
    }),
    prisma.invoice.count({ where: { status: "draft" } }),
    prisma.invoice.count({ where: { status: "preflight_failed" } }),
    prisma.transportBooking.count({
      where: {
        vehicleRequirements: { path: ["requiresWheelchairAccessible"], equals: true },
      },
    }),
  ]);

  return {
    care: {
      careRequestsSubmitted: {
        value: careRequestsSubmitted,
        definition: "Care requests submitted in period",
      },
      careShiftsCompleted: {
        value: careShiftsCompleted,
        definition: "Care shifts marked completed",
      },
      shiftsAwaitingApproval: {
        value: shiftsAwaitingApproval,
        definition: "Shifts waiting for participant approval",
      },
      timesheetsDisputed: {
        value: timesheetsDisputed,
        definition: "Timesheets in disputed status",
      },
    },
    transport: {
      transportBookingsRequested: {
        value: transportRequested,
        definition: "Transport bookings requested",
      },
      transportBookingsCompleted: {
        value: transportCompleted,
        definition: "Transport bookings completed",
      },
      bookingsRequiringWat: {
        value: wavBookings,
        definition: "Bookings flagging wheelchair accessible vehicle need",
      },
    },
    incidents: {
      openCriticalIncidents: {
        value: openCriticalIncidents,
        definition: "Open incidents with critical severity",
      },
    },
    billing: {
      draftInvoices: {
        value: draftInvoices,
        definition: "Invoices in draft status",
      },
      preflightFailures: {
        value: preflightFailed,
        definition: "Invoices that failed billing preflight",
      },
    },
  };
}

export async function getIncidentAnalytics() {
  const byCategory = await prisma.incidentReport.groupBy({
    by: ["category"],
    _count: true,
  });
  const bySeverity = await prisma.incidentReport.groupBy({
    by: ["severity"],
    _count: true,
  });
  return { byCategory, bySeverity };
}
