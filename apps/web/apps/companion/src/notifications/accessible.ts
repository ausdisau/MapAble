/**
 * Accessible notification helpers — redacted content only.
 * Never put NDIS numbers, addresses, or diagnosis in notification bodies.
 */

export type CompanionNotification = {
  title: string;
  body: string;
  /** Screen reader announcement */
  accessibilityAnnouncement: string;
};

export function careReminderNotification(whenLabel: string): CompanionNotification {
  return {
    title: "Upcoming care",
    body: `You have support scheduled ${whenLabel}.`,
    accessibilityAnnouncement: `Upcoming care ${whenLabel}`,
  };
}

export function transportReminderNotification(
  whenLabel: string,
): CompanionNotification {
  return {
    title: "Upcoming transport",
    body: `Accessible transport is scheduled ${whenLabel}.`,
    accessibilityAnnouncement: `Upcoming transport ${whenLabel}`,
  };
}
