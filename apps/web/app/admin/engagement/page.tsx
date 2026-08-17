import Link from "next/link";

import { EngagementAdminClient } from "@/components/admin/engagement/EngagementAdminClient";
import { requirePermission } from "@/lib/auth/guards";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";

export const metadata = { title: "Engagement | Admin" };

export default async function AdminEngagementPage() {
  await requirePermission("engagement:manage:any");

  if (!isEngagementPlatformEnabled()) {
    return <p>Engagement platform is disabled.</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Engagement triage</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Triage participant feedback and complaints. Link to trust-safety queue
            when complaintId is present.
          </p>
        </div>
        <Link
          href="/admin/engagement/analytics"
          className="text-sm text-primary hover:underline"
        >
          Analytics →
        </Link>
      </header>
      <EngagementAdminClient />
    </div>
  );
}
