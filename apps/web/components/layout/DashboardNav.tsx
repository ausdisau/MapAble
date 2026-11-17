"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  MapAbleRoleNav,
  type MapAbleRoleNavGroup,
} from "@/components/layout/MapAbleRoleNav";
import type { UserRole } from "@/types/mapable";

function link(
  href: string,
  label: string,
  options?: { exact?: boolean; matchPrefix?: string },
) {
  return {
    href,
    label,
    exact: options?.exact,
    matchPrefix: options?.matchPrefix ?? href,
  };
}

export function buildDashboardNavGroups(input: {
  role: UserRole;
  showCareOsNav?: boolean;
}): MapAbleRoleNavGroup[] {
  const workspaceLinks = [
    link("/dashboard", "Home", { exact: true }),
    link("/dashboard/profile", "Profile"),
    link("/dashboard/accessibility", "Accessibility"),
    link("/dashboard/consent", "Consent"),
    link("/dashboard/settings/notifications", "Notification settings"),
  ];

  const discoverLinks = [
    link("/", "Explore MapAble", { exact: true }),
    link("/accessibility-map", "Accessible places"),
    link("/dashboard/find-support", "Find support"),
    link("/dashboard/find-transport", "Find transport"),
    link("/provider-finder", "Provider finder"),
  ];

  const activityLinks = [
    link("/dashboard/bookings", "Bookings"),
    link("/care", "Care", { matchPrefix: "/care" }),
    link("/dashboard/transport", "Transport trips", {
      matchPrefix: "/dashboard/transport",
    }),
    link("/dashboard/jobs", "Jobs"),
    link("/dashboard/calendar", "Calendar"),
    link("/dashboard/timesheets", "Timesheets"),
    link("/dashboard/documents", "Documents"),
    link("/dashboard/billing", "Billing centre"),
  ];

  const safetyLinks = [
    link("/dashboard/safety", "Safety centre"),
    link("/dashboard/engagement", "Your voice"),
    link("/dashboard/cases", "Cases (AI)"),
    link("/dashboard/notifications", "Notifications"),
    link("/dashboard/messages", "Messages"),
  ];

  const careOsLinks = input.showCareOsNav
    ? [
        link("/careos/appointment", "CareOS appointment mission", {
          matchPrefix: "/careos/appointment",
        }),
        link("/careos/missions", "CareOS missions", {
          matchPrefix: "/careos/missions",
        }),
        link("/dashboard/careos", "My CareOS", {
          matchPrefix: "/dashboard/careos",
        }),
      ]
    : [];

  const groups: MapAbleRoleNavGroup[] = [
    { id: "workspace", label: "My MapAble", links: workspaceLinks },
    { id: "discover", label: "Discover", links: discoverLinks },
    { id: "activity", label: "My activity", links: activityLinks },
    { id: "safety", label: "Safety and support", links: safetyLinks },
  ];

  if (careOsLinks.length > 0) {
    groups.push({
      id: "careos",
      label: "CareOS (when enabled)",
      links: careOsLinks,
    });
  }

  if (input.role === "mapable_admin") {
    groups.push({
      id: "admin",
      label: "Administration",
      links: [link("/admin", "Admin")],
    });
  }

  return groups;
}

export function DashboardNav({
  role,
  showCareOsNav = false,
}: {
  userName: string;
  role: UserRole;
  showCareOsNav?: boolean;
}) {
  const pathname = usePathname();
  const groups = buildDashboardNavGroups({ role, showCareOsNav });

  return (
    <MapAbleRoleNav
      label="Dashboard"
      title="My MapAble"
      groups={groups}
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
