import { FhirConnectionPanel } from "@/components/fhir/FhirConnectionPanel";
import { FhirSyncStatus } from "@/components/fhir/FhirSyncStatus";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminFhirPage() {
  await requireAdmin();
  const events = await prisma.fhirSyncEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">FHIR integration</h1>
      <FhirConnectionPanel />
      <FhirSyncStatus events={events} />
    </div>
  );
}
