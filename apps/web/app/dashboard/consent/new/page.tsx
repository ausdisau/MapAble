import { GrantConsentForm } from "@/components/forms/GrantConsentForm";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Grant consent | MapAble Core" };

export default async function NewConsentPage() {
  const organisations = await prisma.organisation.findMany({
    where: { status: "active" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Grant consent</h1>
        <p className="mt-1 max-w-xl text-muted-foreground">
          Explain clearly what you are sharing and why. You can revoke at any
          time.
        </p>
      </header>
      <GrantConsentForm organisations={organisations} />
    </div>
  );
}
