/** Pure helpers safe for client components (no server imports). */

export function isSafeguardingTicket(ticket: {
  category: string;
  requiresIncidentReview: boolean;
}): boolean {
  return (
    ticket.category === "safeguarding_concern" ||
    ticket.requiresIncidentReview
  );
}
