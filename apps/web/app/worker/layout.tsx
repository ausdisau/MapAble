import { AuthenticatedRoleAppShell } from "@/components/layout/AuthenticatedRoleAppShell";
import { WorkerNav } from "@/components/layout/WorkerNav";
import { requirePermission } from "@/lib/auth/guards";

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePermission("care:shift:work");

  return (
    <AuthenticatedRoleAppShell user={user} headerTitle="Worker" secondaryNav={<WorkerNav />}>
      {children}
    </AuthenticatedRoleAppShell>
  );
}
