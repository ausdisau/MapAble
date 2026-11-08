import { ParticipantDashboardViews } from "@/components/dashboard/ParticipantDashboardViews";
import { CoreHubCard } from "@/components/core/CoreHubCard";
import { adaptParticipantDashboard } from "@/lib/access/adaptive";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getMapAbleIntelligenceConfig } from "@/intelligence/config";

export const metadata = { title: "My workspace | MapAble Core" };

export default async function DashboardPage() {
  const user = await requireAuth();

  const [
    profile,
    bookingsCount,
    careBookingsCount,
    transportTripsCount,
    unreadNotifications,
    openSupportCount,
  ] = await Promise.all([
    prisma.participantProfile.findUnique({ where: { userId: user.id } }),
    prisma.booking.count({ where: { participantId: user.id } }),
    prisma.careBooking.count({ where: { participantId: user.id } }),
    prisma.transportTrip.count({ where: { participantId: user.id } }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.supportTicket.count({
      where: {
        OR: [{ createdById: user.id }, { participantId: user.id }],
        status: { notIn: ["resolved", "closed"] },
      },
    }),
  ]);

  const presentation = adaptParticipantDashboard({ profile: null });
  const densityClass =
    presentation.applied &&
    presentation.policy?.informationDensity === "low"
      ? "max-w-2xl space-y-10"
      : "space-y-8";

  const displayName = profile?.preferredName ?? profile?.displayName;

  return (
    <div
      className={densityClass}
      data-adapt-runtime={presentation.applied ? "on" : "off"}
      data-adapt-variant={presentation.policy?.componentVariant ?? "default"}
    >
      <header>
        <h1 className="font-heading text-3xl font-bold">
          {displayName ? "Welcome back, " + displayName : "My MapAble workspace"}
        </h1>
        <p className="mt-2 max-w-2xl text-slate-700">
          Your care, transport and accessibility information in one place.
          You decide what to do next.
        </p>
      </header>

      <ParticipantDashboardViews
        careOsEnabled={getMapAbleIntelligenceConfig().enabled}
        counts={{
          bookings: bookingsCount,
          careBookings: careBookingsCount,
          transportTrips: transportTripsCount,
          unreadNotifications,
          openSupportTickets: openSupportCount,
        }}
      />

      <section aria-labelledby="workspace-services-heading" className="space-y-4">
        <h2 id="workspace-services-heading" className="font-heading text-2xl font-bold">
          My services
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <CoreHubCard
            title="My care"
            description="Find and review support arrangements"
            href="/care/bookings"
          />
          <CoreHubCard
            title="My transport"
            description="Request or review accessible trips"
            href="/dashboard/transport"
          />
          <CoreHubCard
            title="Accessible places"
            description="Browse access information and known limitations"
            href="/accessibility-map"
          />
          <CoreHubCard
            title="Find support"
            description="Explore support providers with clear verification information"
            href="/dashboard/find-support"
          />
        </div>
      </section>

      <p className="text-sm text-slate-700">
        Looking for account settings, privacy, documents or billing? Use the
        <strong> My profile and settings </strong>section in the workspace menu.
        For urgent danger in Australia, call 000.
      </p>
    </div>
  );
}
