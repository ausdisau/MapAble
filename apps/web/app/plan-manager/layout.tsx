import { AuthenticatedRoleAppShell } from "@/components/layout/AuthenticatedRoleAppShell";
import { PlanManagerNav } from "@/components/layout/PlanManagerNav";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function PlanManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <AuthenticatedRoleAppShell user={user} headerTitle="Plan manager" secondaryNav={<PlanManagerNav />}>
      {children}
    </AuthenticatedRoleAppShell>
  );
}
