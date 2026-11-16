import Link from "next/link";

import { SafeguardingAdmin } from "@/components/admin/back-of-house/SafeguardingAdmin";
import { requireAdminScope } from "@/lib/auth/guards";
import { isCapabilityPassportPreviewEnabled } from "@/lib/config/capability-passport";

export const metadata = { title: "Safeguarding ops | MapAble Admin" };

export default async function AdminOpsSafeguardingPage() {
  await requireAdminScope("admin:safeguarding:read");
  return (
    <div className="space-y-6">
      {isCapabilityPassportPreviewEnabled() ? (
        <p className="px-1 text-sm">
          <Link className="font-medium underline" href="/admin/ops/safeguarding/capability-review">
            Open Capability Review queue
          </Link>
        </p>
      ) : null}
      <SafeguardingAdmin />
    </div>
  );
}
