import { BillingAdmin } from "@/components/admin/back-of-house/BillingAdmin";
import { requireAdminScope } from "@/lib/auth/guards";

export const metadata = { title: "Billing ops | MapAble Admin" };

export default async function AdminOpsBillingPage() {
  await requireAdminScope("admin:billing:read");
  return <BillingAdmin />;
}
