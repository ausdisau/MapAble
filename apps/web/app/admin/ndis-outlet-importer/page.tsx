import { NdisOutletImportPanel } from "@/components/admin/NdisOutletImportPanel";
import { requireAdmin } from "@/lib/auth/guards";
import { getPublishedNdisDirectoryStatus } from "@/lib/ingestion/ndis-outlet-import-service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NdisOutletImporterPage() {
  await requireAdmin();
  const [published, latest] = await Promise.all([
    getPublishedNdisDirectoryStatus(),
    prisma.ndisDirectoryImportRun.findFirst({
      orderBy: { startedAt: "desc" },
      select: {
        id: true, status: true, sourceSha256: true, sourceDate: true,
        outletCount: true, organisationCount: true, startedAt: true,
      },
    }),
  ]);
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
      <h1 className="text-3xl font-bold">NDIS Provider and Outlet Importer</h1>
      <p>
        Safe administrator preview of the NDIA provider-directory export.
        Preview never publishes data. A controlled CLI job stages immutable
        snapshots; a separate human-approved command changes the published pointer.
      </p>
      <NdisOutletImportPanel published={published}
        latest={latest ? {
          id: latest.id, status: latest.status,
          sourceSha256: latest.sourceSha256,
          sourceDate: latest.sourceDate,
          outletCount: latest.outletCount,
          organisationCount: latest.organisationCount,
          startedAt: latest.startedAt.toISOString(),
        } : null} />
    </main>
  );
}
