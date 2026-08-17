import { AuthenticatedRoleAppShell } from "@/components/layout/AuthenticatedRoleAppShell";
import { SupportCoordinatorNav } from "@/components/layout/SupportCoordinatorNav";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function SupportCoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <AuthenticatedRoleAppShell
      user={user}
      headerTitle="Support coordinator"
      secondaryNav={<SupportCoordinatorNav />}
    >
      {children}
    </AuthenticatedRoleAppShell>
  );
}
