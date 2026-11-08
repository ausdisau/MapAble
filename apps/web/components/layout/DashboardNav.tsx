"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { usePathname } from "next/navigation";

import type { UserRole } from "@/types/mapable";

type DashboardLink = {
  href: string;
  label: string;
  exact?: boolean;
};

const SERVICE_LINKS: DashboardLink[] = [
  { href: "/dashboard", label: "Home / My Day", exact: true },
  { href: "/care/bookings", label: "My care and support" },
  { href: "/dashboard/transport", label: "My transport" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/calendar", label: "Calendar" },
  { href: "/dashboard/find-support", label: "Find support" },
  { href: "/accessibility-map", label: "Accessible places" },
  { href: "/dashboard/jobs", label: "Jobs" },
  { href: "/dashboard/messages", label: "Messages" },
];

const PROFILE_LINKS: DashboardLink[] = [
  { href: "/dashboard/profile", label: "Personal details" },
  { href: "/dashboard/support-profile", label: "Support preferences" },
  { href: "/dashboard/accessibility", label: "Accessibility preferences" },
  { href: "/dashboard/consent", label: "Privacy and consent" },
  { href: "/dashboard/documents", label: "Documents" },
  { href: "/dashboard/billing", label: "Billing and payments" },
  { href: "/dashboard/settings/notifications", label: "Notification settings" },
];

const HELP_LINKS: DashboardLink[] = [
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/safety", label: "Help and safety" },
  { href: "/dashboard/engagement", label: "Feedback and complaints" },
];

function linkIsActive(pathname: string, link: DashboardLink): boolean {
  return link.exact
    ? pathname === link.href
    : pathname === link.href || pathname.startsWith(link.href + "/");
}

export function DashboardNav({
  role,
  showCareOsNav = false,
  showMatchingPreviewNav = false,
}: {
  userName: string;
  role: UserRole;
  showCareOsNav?: boolean;
  showMatchingPreviewNav?: boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navId = useId();
  const services: DashboardLink[] = [
    SERVICE_LINKS[0]!,
    ...(showMatchingPreviewNav && (role === "participant" || role === "mapable_admin")
      ? [{ href: "/dashboard/matching-preview", label: "Worker matching preview (demo)" }]
      : []),
    ...SERVICE_LINKS.slice(1),
  ];

  const groups = [
    { title: "My services", links: services },
    { title: "My profile and settings", links: PROFILE_LINKS },
    { title: "Help and updates", links: HELP_LINKS },
    ...(showCareOsNav
      ? [{ title: "Optional assistance", links: [{ href: "/dashboard/careos", label: "My CareOS" }] }]
      : []),
    ...(role === "mapable_admin"
      ? [{ title: "Separate workspace", links: [{ href: "/admin", label: "Administration" }] }]
      : []),
  ];

  return (
    <div className="w-full">
      <button
        type="button"
        aria-controls={navId}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((value) => !value)}
        className="flex min-h-11 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-3 text-left font-semibold text-[#0C1833] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/50 md:hidden"
      >
        <span>{mobileOpen ? "Hide workspace menu" : "Open workspace menu"}</span>
        <span aria-hidden="true">{mobileOpen ? "−" : "+"}</span>
      </button>
      <nav
        id={navId}
        aria-label="MapAble participant workspace"
        className={(
          mobileOpen ? "mt-2 block" : "hidden"
        ) + " max-h-[75vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 md:sticky md:top-4 md:mt-0 md:block md:max-h-[calc(100vh-6rem)]"}
      >
        <p className="mb-4 px-3 text-base font-bold text-[#0C1833]">
          My workspace
        </p>
        {groups.map((group) => (
          <section key={group.title} className="mb-4 last:mb-0">
            <h2 className="px-3 pb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
              {group.title}
            </h2>
            <ul className="space-y-1">
              {group.links.map((link) => {
                const active = linkIsActive(pathname, link);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={
                        "flex min-h-11 items-center rounded-lg border-l-4 px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/50 " +
                        (active
                          ? "border-[#005B7F] bg-[#E8F5F7] text-[#0C1833]"
                          : "border-transparent text-[#213451] hover:bg-slate-100")
                      }
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>
    </div>
  );
}
