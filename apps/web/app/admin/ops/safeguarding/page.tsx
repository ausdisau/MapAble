import { SafeguardingAdmin } from "@/components/admin/back-of-house/SafeguardingAdmin";
import { requireAdminScope } from "@/lib/auth/guards";

export const metadata = { title: "Safeguarding ops | MapAble Admin" };

export default async function AdminOpsSafeguardingPage() {
  await requireAdminScope("admin:safeguarding:read");
  return <SafeguardingAdmin />;
}
