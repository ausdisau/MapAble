import { AdminScreeningDashboard } from "@/components/admin/AdminScreeningDashboard";
import { requireAdminScope } from "@/lib/auth/guards";

export const metadata = { title: "Worker screening ops | MapAble Admin" };

export default async function AdminOpsScreeningPage() {
  await requireAdminScope("admin:workers:read");
  return <AdminScreeningDashboard />;
}
