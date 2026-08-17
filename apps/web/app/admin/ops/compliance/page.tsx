import { ComplianceAdmin } from "@/components/admin/back-of-house/ComplianceAdmin";
import { requireAdminScope } from "@/lib/auth/guards";

export const metadata = { title: "Compliance ops | MapAble Admin" };

export default async function AdminOpsCompliancePage() {
  await requireAdminScope("admin:compliance:read");
  return <ComplianceAdmin />;
}
