import { AuthenticatedRoleAppShell } from "@/components/layout/AuthenticatedRoleAppShell";
import { DriverNav } from "@/components/layout/DriverNav";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <AuthenticatedRoleAppShell user={user} headerTitle="Driver" secondaryNav={<DriverNav />}>
      <div className="pb-20">{children}</div>
    </AuthenticatedRoleAppShell>
  );
}
