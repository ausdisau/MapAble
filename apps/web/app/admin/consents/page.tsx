import { ConsentScopeCard } from "@/components/consent/ConsentScopeCard";
import { consentScopeFromPrisma } from "@/lib/consent/scope-map";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Consents | Admin" };

export default async function AdminConsentsPage() {
  const consents = await prisma.consentRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      subjectUser: { select: { name: true } },
      grantedToOrganisation: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Consent records</h1>
      <div className="space-y-4">
        {consents.map((c) => (
          <div key={c.id}>
            <p className="text-sm font-medium">{c.subjectUser.name}</p>
            <ConsentScopeCard
              scope={consentScopeFromPrisma(c.scope)}
              purpose={c.purpose}
              status={c.status}
              grantedToName={c.grantedToOrganisation?.name}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
