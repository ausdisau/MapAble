"use client";

import Link from "next/link";

import { MapAbleRoleNav } from "@/components/layout/MapAbleRoleNav";

const LINKS = [
  { href: "/worker/today", label: "Today", matchPrefix: "/worker/today" },
  { href: "/worker/verify-id", label: "Verify ID" },
  { href: "/worker/onboarding", label: "Onboarding" },
  { href: "/worker/service-log", label: "Service log" },
  { href: "/worker/report-issue", label: "Report issue" },
];

export function WorkerNav() {
  return (
    <MapAbleRoleNav
      label="Worker navigation"
      title="Worker portal"
      links={LINKS}
      trailing={
        <Link href="/dashboard" className="text-sm font-black text-[#005B7F] hover:underline">
          Dashboard
        </Link>
      }
    />
  );
}
