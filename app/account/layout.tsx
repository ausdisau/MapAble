import { DashboardAppShell } from "@/components/layout/DashboardAppShell";
import { getMapAbleIntelligenceConfig } from "@/intelligence/config";
import { requireAuth } from "@/lib/auth/guards";
import type { UserRole } from "@/types/mapable";

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const showCareOsNav = getMapAbleIntelligenceConfig().enabled;

  return (
    <DashboardAppShell
      userName={user.name}
      role={user.primaryRole as UserRole}
      showCareOsNav={showCareOsNav}
    >
      {children}
    </DashboardAppShell>
  );
}
