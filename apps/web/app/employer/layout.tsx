import { AuthenticatedRoleAppShell } from "@/components/layout/AuthenticatedRoleAppShell";
import { EmployerNav } from "@/components/layout/EmployerNav";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <AuthenticatedRoleAppShell user={user} headerTitle="Employer" secondaryNav={<EmployerNav />}>
      {children}
    </AuthenticatedRoleAppShell>
  );
}
