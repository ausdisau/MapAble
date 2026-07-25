import Link from "next/link";

import { VirtualCareHub } from "@/components/telehealth/VirtualCareHub";
import { requireAuth } from "@/lib/auth/guards";
import { isVirtualCareHubEnabled } from "@/lib/config/strategic-2026";

export const metadata = { title: "Virtual Care Hub | MapAble" };

export default async function VirtualCareHubPage() {
  const user = await requireAuth();

  if (!isVirtualCareHubEnabled()) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-12">
        <h1 className="font-heading text-2xl font-bold">Virtual Care Hub</h1>
        <p className="text-sm text-muted-foreground">
          This scaffold is disabled. Set{" "}
          <code className="rounded bg-muted px-1">
            MAPABLE_VIRTUAL_CARE_HUB_ENABLED=true
          </code>{" "}
          to preview.
        </p>
        <Link href="/telehealth" className="text-sm underline">
          Back to telehealth
        </Link>
      </div>
    );
  }

  return (
    <VirtualCareHub
      participantId={user.id}
      supportItemCode="15_037_0117_1_3"
    />
  );
}
