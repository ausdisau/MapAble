"use client";

import Link from "next/link";

import { MapAbleRoleNav } from "@/components/layout/MapAbleRoleNav";

const LINKS = [
  { href: "/support-coordinator", label: "Overview", exact: true },
  { href: "/support-coordinator/caseload", label: "Caseload" },
  { href: "/support-coordinator/participants", label: "Participants" },
  { href: "/support-coordinator/tasks", label: "Tasks" },
  { href: "/support-coordinator/transport", label: "Transport" },
];

export function SupportCoordinatorNav() {
  return (
    <MapAbleRoleNav
      label="Support coordinator navigation"
      title="Support coordinator"
      links={LINKS}
      trailing={
        <Link href="/dashboard" className="text-sm font-black text-[#005B7F] hover:underline">
          Dashboard
        </Link>
      }
    />
  );
}
