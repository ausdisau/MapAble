"use client";

import { MapAbleRoleNav } from "@/components/layout/MapAbleRoleNav";
import { CORE_PLATFORM_LINKS } from "@/lib/platform/core-ui/navigation";

export function CoreHubNav() {
  return (
    <MapAbleRoleNav
      label="MapAble Core"
      title="Platform hub"
      links={CORE_PLATFORM_LINKS.map((link) => ({
        href: link.href,
        label: link.label,
        exact: link.href === "/core",
      }))}
    />
  );
}
