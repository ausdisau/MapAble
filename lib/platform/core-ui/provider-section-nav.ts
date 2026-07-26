import type { SectionNavLink } from "@/components/provider/ProviderSectionNav";

export const PROVIDER_CARE_SUB_LINKS: SectionNavLink[] = [
  { href: "/provider/care/requests", label: "Inbox" },
  { href: "/provider/care/roster", label: "Roster" },
  { href: "/provider/care/shifts", label: "Shifts" },
  { href: "/provider/care/service-logs", label: "Logs" },
];

export const PROVIDER_TRANSPORT_SUB_LINKS: SectionNavLink[] = [
  { href: "/provider/transport", label: "Bookings" },
  { href: "/provider/transport/dispatch", label: "Dispatch" },
  { href: "/provider/transport/runs", label: "Runs" },
  { href: "/provider/vehicles", label: "Vehicles" },
  { href: "/provider/drivers", label: "Drivers" },
];

export const PROVIDER_CLAIMING_LINKS: SectionNavLink[] = [
  { href: "/provider/ndis-claims/ready", label: "NDIS plan-managed" },
  { href: "/provider/ndia-claims", label: "NDIA direct" },
];

export const PROVIDER_INSIGHTS_LINKS: SectionNavLink[] = [
  { href: "/provider/benchmarks", label: "Benchmarks" },
  { href: "/provider/reports", label: "Reports" },
  { href: "/provider/capacity", label: "Capacity" },
  { href: "/provider/engagement", label: "Engagement" },
];
