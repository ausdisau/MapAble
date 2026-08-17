"use client";

import Link from "next/link";

import { MapAbleRoleNav } from "@/components/layout/MapAbleRoleNav";

const LINKS = [{ href: "/messages", label: "Inbox", exact: true }];

export function MessagesNav() {
  return (
    <MapAbleRoleNav
      label="Messages navigation"
      title="Messages"
      links={LINKS}
      trailing={
        <Link href="/dashboard/messages" className="text-sm font-black text-[#005B7F] hover:underline">
          Dashboard inbox
        </Link>
      }
    />
  );
}
