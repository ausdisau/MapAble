import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderOnboardingAdminPage() {
  await requireAdmin();
  const workflows = await prisma.providerOnboardingWorkflow.findMany({
    include: { tasks: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const orgIds = [...new Set(workflows.map((w) => w.organisationId))];
  const orgs = await prisma.organisation.findMany({
    where: { id: { in: orgIds } },
    select: { id: true, name: true },
  });
  const orgNames = Object.fromEntries(orgs.map((o) => [o.id, o.name]));

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Provider onboarding</h1>
      <p className="text-muted-foreground">
        Automated task workflows — manual review required before go-live.
      </p>
      <ul className="space-y-3">
        {workflows.map((w) => (
          <li key={w.id} className="rounded-lg border p-4">
            <strong>{orgNames[w.organisationId] ?? w.organisationId}</strong>
            <span className="ml-2 text-sm">({w.status})</span>
            <p className="text-sm text-muted-foreground">
              {w.tasks.filter((t) => t.status === "completed").length} of{" "}
              {w.tasks.length} tasks complete
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
