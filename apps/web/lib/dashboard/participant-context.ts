/**
 * Deterministic, read-only participant navigation suggestions.
 *
 * Inputs are counts already scoped to the authenticated user on the server.
 * These are NOT worker matches, availability checks, billing quotes, or
 * clinical/safeguarding risk scores. No model makes decisions here.
 */
export type ParticipantContextCounts = {
  bookings: number;
  careBookings: number;
  transportTrips: number;
  unreadNotifications: number;
  openSupportTickets: number;
};

export type ParticipantContextAction = {
  id: string;
  title: string;
  explanation: string;
  evidence: string;
  href: string;
};

export function getParticipantContextActions(
  counts: ParticipantContextCounts,
): ParticipantContextAction[] {
  const actions: ParticipantContextAction[] = [];

  if (counts.openSupportTickets > 0) {
    actions.push({
      id: "support",
      title: "Review your support requests",
      explanation: "Follow up on an open support ticket or ask for help.",
      evidence: counts.openSupportTickets + " open support ticket(s) on your account",
      href: "/dashboard/safety/support",
    });
  }

  if (counts.unreadNotifications > 0) {
    actions.push({
      id: "notifications",
      title: "Read your notifications",
      explanation: "See updates recorded for your account.",
      evidence: counts.unreadNotifications + " unread notification(s)",
      href: "/dashboard/notifications",
    });
  }

  actions.push(
    counts.bookings > 0
      ? {
          id: "bookings",
          title: "Review your bookings",
          explanation: "See requests and their recorded status.",
          evidence: counts.bookings + " booking(s) on record; not a count of upcoming shifts",
          href: "/dashboard/bookings",
        }
      : {
          id: "bookings",
          title: "Explore a booking",
          explanation: "Start a request when you choose to.",
          evidence: "No bookings on record",
          href: "/dashboard/bookings",
        },
  );

  actions.push(
    counts.careBookings > 0
      ? {
          id: "care",
          title: "Review care arrangements",
          explanation: "Check your recorded care bookings.",
          evidence: counts.careBookings + " care booking(s) on record",
          href: "/care/bookings",
        }
      : {
          id: "care",
          title: "Explore care and support",
          explanation: "Find support on your terms; nothing is booked automatically.",
          evidence: "No care bookings on record",
          href: "/dashboard/find-support",
        },
  );

  actions.push(
    counts.transportTrips > 0
      ? {
          id: "transport",
          title: "Review transport trips",
          explanation: "See your recorded transport arrangements.",
          evidence: counts.transportTrips + " trip(s) on record; not a live tracking feed",
          href: "/dashboard/transport",
        }
      : {
          id: "transport",
          title: "Explore transport",
          explanation: "Look at transport options before requesting a trip.",
          evidence: "No transport trips on record",
          href: "/dashboard/find-transport",
        },
  );

  // Limit cognitive load without hiding primary routes from the sidebar.
  return actions.slice(0, 3);
}
