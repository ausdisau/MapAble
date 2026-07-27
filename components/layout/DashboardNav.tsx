"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MapAbleRoleNav } from "@/components/layout/MapAbleRoleNav";
import type { UserRole } from "@/types/mapable";

const BASE_LINKS = [
  { href: "/dashboard", label: "Control panel", exact: true },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/accessibility", label: "Accessibility" },
  { href: "/dashboard/consent", label: "Consent" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/care", label: "Care", matchPrefix: "/care" },
  { href: "/dashboard/transport", label: "Transport trips", matchPrefix: "/dashboard/transport" },
  { href: "/dashboard/jobs", label: "Jobs" },
  { href: "/dashboard/calendar", label: "Calendar" },
  { href: "/dashboard/find-support", label: "Find support" },
  { href: "/dashboard/find-transport", label: "Find transport" },
  { href: "/dashboard/timesheets", label: "Timesheets" },
  { href: "/dashboard/safety", label: "Safety centre" },
  { href: "/dashboard/engagement", label: "Your voice" },
  { href: "/dashboard/cases", label: "Cases (AI)" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/documents", label: "Documents" },
  { href: "/dashboard/billing", label: "Billing centre" },
  { href: "/dashboard/settings/notifications", label: "Notification settings" },
] as const;

const CAREOS_LINKS = [
  {
    href: "/careos/appointment",
    label: "CareOS appointment mission",
    matchPrefix: "/careos/appointment",
  },
  {
    href: "/careos/missions",
    label: "CareOS missions",
    matchPrefix: "/careos/missions",
  },
  {
    href: "/dashboard/careos",
    label: "My CareOS",
    matchPrefix: "/dashboard/careos",
  },
] as const;

export function DashboardNav({
  role,
  showCareOsNav = false,
}: {
  userName: string;
  role: UserRole;
  showCareOsNav?: boolean;
}) {
  const pathname = usePathname();
  const links = [
    BASE_LINKS[0]!,
    ...(showCareOsNav ? CAREOS_LINKS : []),
    ...BASE_LINKS.slice(1),
    ...(role === "mapable_admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <MapAbleRoleNav
      label="Dashboard"
      title="Your control panel"
      links={links.map((link) => ({
        href: link.href,
        label: link.label,
        exact: "exact" in link ? link.exact : undefined,
        matchPrefix: "matchPrefix" in link ? link.matchPrefix : link.href,
      }))}
      trailing={
        pathname.startsWith("/provider-finder") ? null : (
          <Link
            href="/provider-finder"
            className="text-sm font-black text-[#005B7F] hover:underline"
          >
            Find support
          </Link>
        )
      }
    />
  );
}
