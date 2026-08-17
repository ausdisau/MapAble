import { requireAdminOpsAccess } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminOpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminOpsAccess();
  return children;
}
