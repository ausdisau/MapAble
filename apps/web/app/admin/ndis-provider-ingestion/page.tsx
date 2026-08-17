import { NdisProviderIngestionPanel } from "@/components/admin/NdisProviderIngestionPanel";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function NdisProviderIngestionAdminPage() {
  await requireAdmin();

  const lastRun = await prisma.ndisProviderIngestionRun.findFirst({
    orderBy: { startedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          NDIS provider directory
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Ingestion pipeline for the public NDIS provider finder JSON. Used for
          provider discovery, care matching, and transport coordination — not as
          MapAble-verified registration status.
        </p>
      </div>

      <NdisProviderIngestionPanel
        lastRun={
          lastRun
            ? {
                status: lastRun.status,
                providerCount: lastRun.providerCount,
                startedAt: lastRun.startedAt.toISOString(),
                finishedAt: lastRun.finishedAt?.toISOString() ?? null,
                errorMessage: lastRun.errorMessage,
              }
            : null
        }
      />
    </div>
  );
}
