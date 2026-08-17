"use client";

import Link from "next/link";

import { MapAbleRoleNav } from "@/components/layout/MapAbleRoleNav";

const LINKS = [
  { href: "/driver/trips", label: "Trips", matchPrefix: "/driver/trips" },
  { href: "/driver/profile", label: "Profile" },
];

export function DriverNav() {
  return (
    <MapAbleRoleNav
      label="Driver navigation"
      title="MapAble Driver"
      links={LINKS}
      trailing={
        <Link href="/dashboard" className="text-sm font-black text-[#005B7F] hover:underline">
          Dashboard
        </Link>
      }
    />
  );
}
