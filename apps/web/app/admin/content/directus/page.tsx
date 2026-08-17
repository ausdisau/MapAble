import { ContentSyncStatus } from "@/components/content/ContentSyncStatus";
import { requireAdmin } from "@/lib/auth/guards";
import { isDirectusEnabled } from "@/lib/directus/directus-client";
import { prisma } from "@/lib/prisma";

export default async function AdminDirectusPage() {
  await requireAdmin();
  const records = await prisma.contentSyncRecord.findMany({
    orderBy: { lastSyncedAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Directus content</h1>
      <p className="text-sm text-muted-foreground">
        Low-risk public content only — never participant or incident records.
      </p>
      <ContentSyncStatus enabled={isDirectusEnabled()} records={records} />
    </div>
  );
}
