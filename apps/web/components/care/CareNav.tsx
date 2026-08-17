"use client";

import Link from "next/link";

import { MapAbleRoleNav } from "@/components/layout/MapAbleRoleNav";

const NAV_ITEMS = [
  { href: "/care", label: "Overview", exact: true },
  { href: "/care/request", label: "Request support" },
  { href: "/care/bookings", label: "Bookings" },
  { href: "/care/service-logs", label: "Service logs" },
  { href: "/care/shifts", label: "Shifts" },
  { href: "/care/find", label: "Find providers" },
] as const;

export function CareNav() {
  return (
    <MapAbleRoleNav
      label="Care navigation"
      title="MapAble Care"
      links={NAV_ITEMS.map((item) => ({
        href: item.href,
        label: item.label,
        exact: "exact" in item ? item.exact : undefined,
      }))}
      trailing={
        <Link href="/dashboard" className="text-sm font-black text-[#005B7F] hover:underline">
          Dashboard
        </Link>
      }
    />
  );
}
