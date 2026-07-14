import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderCapacityPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const blocks = await prisma.capacityBlock.findMany({
    where: { organisationId: { in: orgIds } },
    orderBy: { date: "asc" },
  });
  const [capabilityEvidence, credentialEvidence] = await Promise.all([
    prisma.providerCapabilityEvidence.findMany({
      where: { organisationId: { in: orgIds } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.workerCredentialEvidence.findMany({
      where: { workerProfile: { organisationId: { in: orgIds } } },
      orderBy: { expiresAt: "asc" },
      take: 20,
      include: { workerProfile: { select: { displayName: true } } },
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Capacity</h1>
      <p className="text-sm text-muted-foreground">
        Simple capacity tracking for warnings — not AI scheduling.
      </p>
      <ul>
        {blocks.map((b) => (
          <li key={b.id} className="rounded-lg border p-3">
            {b.serviceType}: {b.bookedCapacity}/{b.totalCapacity} on{" "}
            {b.date.toLocaleDateString("en-AU")}
          </li>
        ))}
      </ul>
      <section aria-labelledby="provider-evidence-heading" className="space-y-3">
        <h2 id="provider-evidence-heading" className="font-heading text-xl font-bold">
          Accessibility evidence
        </h2>
        {capabilityEvidence.length ? (
          <ul className="space-y-2">
            {capabilityEvidence.map((evidence) => (
              <li key={evidence.id} className="rounded-lg border p-3 text-sm">
                <strong>{evidence.serviceType}: {evidence.capability}</strong>
                <span className="block">Status: {evidence.verificationStatus}</span>
                <span className="block text-muted-foreground">
                  {evidence.expiresAt ? `Expires ${evidence.expiresAt.toLocaleDateString("en-AU")}` : "No expiry recorded"}
                </span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">No capability evidence has been recorded.</p>}
      </section>
      <section aria-labelledby="worker-evidence-heading" className="space-y-3">
        <h2 id="worker-evidence-heading" className="font-heading text-xl font-bold">
          Worker credential evidence
        </h2>
        {credentialEvidence.length ? (
          <ul className="space-y-2">
            {credentialEvidence.map((evidence) => (
              <li key={evidence.id} className="rounded-lg border p-3 text-sm">
                <strong>{evidence.workerProfile.displayName}: {evidence.credentialType}</strong>
                <span className="block">Status: {evidence.verificationStatus}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">No worker credential evidence has been recorded.</p>}
      </section>
    </div>
  );
}
