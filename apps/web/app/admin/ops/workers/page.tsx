import { WorkersAdmin } from "@/components/admin/back-of-house/WorkersAdmin";
import { requireAdminScope } from "@/lib/auth/guards";

export const metadata = { title: "Workers ops | MapAble Admin" };

export default async function AdminOpsWorkersPage() {
  await requireAdminScope("admin:workers:read");
  return <WorkersAdmin />;
}
