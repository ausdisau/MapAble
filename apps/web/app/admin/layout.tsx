import { AdminNav } from "@/components/layout/AdminNav";
import { AuthenticatedRoleAppShell } from "@/components/layout/AuthenticatedRoleAppShell";
import { requireAdminOpsAccess } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdminOpsAccess();

  return (
    <AuthenticatedRoleAppShell user={user} headerTitle="Admin" secondaryNav={<AdminNav />}>
      {children}
    </AuthenticatedRoleAppShell>
  );
}
