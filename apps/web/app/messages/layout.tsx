import { AuthenticatedRoleAppShell } from "@/components/layout/AuthenticatedRoleAppShell";
import { MessagesNav } from "@/components/layout/MessagesNav";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <AuthenticatedRoleAppShell user={user} headerTitle="Messages" secondaryNav={<MessagesNav />}>
      {children}
    </AuthenticatedRoleAppShell>
  );
}
