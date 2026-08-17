"use client";

import Link from "next/link";

import { MapAbleRoleNav } from "@/components/layout/MapAbleRoleNav";

const LINKS = [
  { href: "/employer/jobs", label: "Jobs", matchPrefix: "/employer/jobs" },
  { href: "/employer/applications", label: "Applications" },
  { href: "/employer/calendar", label: "Calendar" },
];

export function EmployerNav() {
  return (
    <MapAbleRoleNav
      label="Employer navigation"
      title="Employer portal"
      links={LINKS}
      trailing={
        <Link href="/dashboard" className="text-sm font-black text-[#005B7F] hover:underline">
          Dashboard
        </Link>
      }
    />
  );
}
