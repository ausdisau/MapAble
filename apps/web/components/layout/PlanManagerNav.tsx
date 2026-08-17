"use client";

import Link from "next/link";

import { MapAbleRoleNav } from "@/components/layout/MapAbleRoleNav";

const LINKS = [
  { href: "/plan-manager", label: "Overview", exact: true },
  { href: "/plan-manager/invoices", label: "Invoices" },
];

export function PlanManagerNav() {
  return (
    <MapAbleRoleNav
      label="Plan manager navigation"
      title="Plan manager"
      links={LINKS}
      trailing={
        <Link href="/dashboard" className="text-sm font-black text-[#005B7F] hover:underline">
          Dashboard
        </Link>
      }
    />
  );
}
