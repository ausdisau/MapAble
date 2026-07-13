import { CoreHubCard } from "@/components/core/CoreHubCard";
import { requireAuth } from "@/lib/auth/guards";
import { roleLabel } from "@/lib/auth/roles";
import { caseListWhereForUser } from "@/lib/cases/case-access";
import { caseManagementConfig } from "@/lib/config/case-management";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { countOpenSubmissions } from "@/lib/engagement/engagement-submission-service";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Control panel | MapAble Core" };

export default async function DashboardPage() {
  const user = await requireAuth();

  const [
    profile,
    bookingsCount,
    careBookingsCount,
    transportTripsCount,
    unreadNotifications,
    incidentCount,
    openSupportCount,
    openCaseCount,
    openEngagementCount,
  ] = await Promise.all([
    prisma.participantProfile.findUnique({ where: { userId: user.id } }),
    prisma.booking.count({ where: { participantId: user.id } }),
    prisma.careBooking.count({ where: { participantId: user.id } }),
    prisma.transportTrip.count({ where: { participantId: user.id } }),
    prisma.notification.count({
      where: { userId: user.id, readAt: null },
    }),
    prisma.incidentReport.count({
      where: {
        OR: [{ participantId: user.id }, { reportedById: user.id }],
      },
    }),
    prisma.supportTicket.count({
      where: {
        OR: [{ createdById: user.id }, { participantId: user.id }],
        status: { notIn: ["resolved", "closed"] },
      },
    }),
    caseManagementConfig.enabled
      ? prisma.case.count({
          where: {
            AND: [
              caseListWhereForUser(user.id, user.primaryRole),
              { status: { not: "closed" } },
            ],
          },
        })
      : Promise.resolve(0),
    isEngagementPlatformEnabled()
      ? countOpenSubmissions(user.id)
      : Promise.resolve(0),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold">Your control panel</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Welcome to MapAble Core. You are signed in as a{" "}
          <strong>{roleLabel(user.primaryRole)}</strong>. Manage your profile,
          accessibility preferences, consent, bookings and transport trips from
          here.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CoreHubCard
          title="Billing centre"
          description="Invoices, funding sources and payments"
          href="/dashboard/billing"
        />
        <CoreHubCard
          title="Safety centre"
          description={
            openSupportCount || incidentCount
              ? `${incidentCount} incident report(s) · ${openSupportCount} open support ticket(s)`
              : "Incident reports and support tickets"
          }
          href="/dashboard/safety"
        />
        {isEngagementPlatformEnabled() ? (
          <CoreHubCard
            title="Your voice"
            description={
              openEngagementCount
                ? `${openEngagementCount} open feedback or complaint item(s)`
                : "Feedback, complaints, and improvement updates"
            }
            href="/dashboard/engagement"
          />
        ) : null}
        <CoreHubCard
          title="MapAble Care"
          description={
            careBookingsCount
              ? `${careBookingsCount} care booking(s)`
              : "Request disability supports and track service delivery"
          }
          href="/care/bookings"
        />
        <CoreHubCard
          title="Transport trips"
          description={
            transportTripsCount
              ? `${transportTripsCount} scheduled transport trip(s)`
              : "Request and track scheduled transport"
          }
          href="/dashboard/transport"
        />
        <CoreHubCard
          title="Profile"
          description={
            profile
              ? `Display name: ${profile.displayName}`
              : "Set up your participant profile"
          }
          href="/dashboard/profile"
        />
        <CoreHubCard
          title="Accessibility"
          description="Your access needs travel with you across MapAble services"
          href="/dashboard/accessibility"
        />
        <CoreHubCard
          title="Consent"
          description="Control who can see your information"
          href="/dashboard/consent"
        />
        <CoreHubCard
          title="My CareOS"
          description="Coordinate care and transport with participant-controlled recommendations"
          href="/dashboard/careos"
        />
        <CoreHubCard
          title="Bookings"
          description={`${bookingsCount} booking request(s)`}
          href="/dashboard/bookings"
        />
        <CoreHubCard
          title="Notifications"
          description={
            unreadNotifications
              ? `${unreadNotifications} unread`
              : "No unread notifications"
          }
          href="/dashboard/notifications"
        />
        {caseManagementConfig.enabled ? (
          <CoreHubCard
            title="Cases (AI)"
            description={
              openCaseCount
                ? `${openCaseCount} open case(s) · AI insights are advisory only`
                : "AI-enabled case management for support coordination"
            }
            href="/dashboard/cases"
          />
        ) : null}
      </div>
    </div>
  );
}
