"use client";

import Link from "next/link";

import { MapAbleRoleNav } from "@/components/layout/MapAbleRoleNav";

const LINKS = [
  { href: "/transport", label: "Overview", exact: true },
  { href: "/transport/request", label: "Request trip" },
  { href: "/transport/profile", label: "Access profile" },
  {
    href: "/transport/dashboard",
    label: "My trips",
    matchPrefix: "/transport/dashboard",
  },
  { href: "/dashboard/find-transport", label: "Find operators" },
  { href: "/transport/operator", label: "Operator", matchPrefix: "/transport/operator" },
  { href: "/transport/driver", label: "Driver" },
  {
    href: "/dashboard/transport/legacy",
    label: "Legacy bookings",
    matchPrefix: "/dashboard/transport/legacy",
  },
];

export function TransportNav() {
  return (
    <MapAbleRoleNav
      label="Transport navigation"
      title="MapAble Transport"
      links={LINKS}
      trailing={
        <Link
          href="/dashboard"
          className="text-sm font-black text-[#005B7F] hover:underline"
        >
          Dashboard
        </Link>
      }
    />
  );
}
