"use client";

import Link from "next/link";

import { MapAbleRoleNav } from "@/components/layout/MapAbleRoleNav";

const LINKS = [{ href: "/government-partner", label: "Overview", exact: true }];

export function GovernmentPartnerNav() {
  return (
    <MapAbleRoleNav
      label="Government partner navigation"
      title="Government partner"
      links={LINKS}
      trailing={
        <Link href="/dashboard" className="text-sm font-black text-[#005B7F] hover:underline">
          Dashboard
        </Link>
      }
    />
  );
}
