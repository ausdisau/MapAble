import { TrustSafetyAdmin } from "@/components/admin/back-of-house/TrustSafetyAdmin";
import { requireAdminScope } from "@/lib/auth/guards";

export const metadata = { title: "Trust & safety | MapAble Admin" };

export default async function TrustSafetyOpsPage() {
  await requireAdminScope("admin:safeguarding:read");

  return <TrustSafetyAdmin />;
}
