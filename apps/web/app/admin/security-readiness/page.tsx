import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function SecurityReadinessPage() {
  await requireAdmin();
  const frameworks = await prisma.securityFramework.findMany({
    include: { controls: { take: 5 } },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Security readiness</h1>
      <p className="text-muted-foreground">
        SOC 2 and ISO 27001 evidence scaffolding — MapAble is not certified.
      </p>
      {frameworks.map((f) => (
        <section key={f.id} className="rounded-lg border p-4">
          <h2 className="font-semibold">{f.name}</h2>
          <p className="text-sm">{f.controls.length} controls tracked</p>
        </section>
      ))}
    </div>
  );
}
