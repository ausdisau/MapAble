import { PortalNav } from "@/components/core/PortalNav";
import { AuthenticatedRoleAppShell } from "@/components/layout/AuthenticatedRoleAppShell";
import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { PROVIDER_NAV_LINKS } from "@/lib/platform/core-ui/provider-nav";

export const dynamic = "force-dynamic";

export default async function ProviderConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  await requirePermission("care:read:org");

  return (
    <AuthenticatedRoleAppShell
      user={user}
      headerTitle="Provider"
      secondaryNav={
        <PortalNav
          title="Provider control panel"
          links={PROVIDER_NAV_LINKS}
          backHref="/dashboard"
          backLabel="Dashboard"
        />
      }
    >
      {children}
    </AuthenticatedRoleAppShell>
  );
}
