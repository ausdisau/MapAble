import type { PortalNavLink } from "@/components/core/PortalNav";

/** Top-level provider console nav — section hubs only. */
export const PROVIDER_NAV_LINKS: PortalNavLink[] = [
  { href: "/provider", label: "Control panel", match: "exact" },
  { href: "/provider/care", label: "Care" },
  { href: "/provider/transport", label: "Transport" },
  { href: "/provider/workers", label: "Workers" },
  { href: "/provider/calendar", label: "Calendar" },
  { href: "/provider/bookings", label: "Bookings" },
  { href: "/provider/claiming", label: "Claiming" },
  { href: "/provider/billing", label: "Billing" },
  { href: "/provider/insights", label: "Insights" },
  { href: "/provider/engagement", label: "Engagement" },
  { href: "/provider/developer", label: "Developer" },
];
