import { AdminDashboard } from "@/components/admin/back-of-house/AdminDashboard";
import { requireAdminScope } from "@/lib/auth/guards";

export const metadata = { title: "Admin | MapAble Core" };

export default async function AdminDashboardPage() {
  await requireAdminScope("admin:command-centre:read");
  return <AdminDashboard />;
}
