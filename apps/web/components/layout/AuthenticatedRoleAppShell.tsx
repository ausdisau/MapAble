import type { ReactNode } from "react";

import { MapAbleRoleAppShell } from "@/components/layout/MapAbleRoleAppShell";
import { MapAbleUserBar } from "@/components/layout/MapAbleUserBar";
import type { CurrentUser } from "@/lib/auth/current-user";
import type { UserRole } from "@/types/mapable";

export function AuthenticatedRoleAppShell({
  user,
  headerTitle,
  secondaryNav,
  children,
  logoHref = "/dashboard",
}: {
  user: CurrentUser;
  headerTitle: string;
  secondaryNav: ReactNode;
  children: ReactNode;
  logoHref?: string;
}) {
  return (
    <MapAbleRoleAppShell
      headerTitle={headerTitle}
      logoHref={logoHref}
      headerActions={
        <MapAbleUserBar userName={user.name} role={user.primaryRole as UserRole} />
      }
      secondaryNav={secondaryNav}
    >
      {children}
    </MapAbleRoleAppShell>
  );
}
