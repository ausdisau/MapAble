import { DashboardAppShell } from "@/components/layout/DashboardAppShell";
import { requireAuth } from "@/lib/auth/guards";
import type { UserRole } from "@/types/mapable";

export const dynamic = "force-dynamic";

export default async function ClinicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  return (
    <DashboardAppShell userName={user.name} role={user.primaryRole as UserRole}>
      {children}
    </DashboardAppShell>
  );
}
