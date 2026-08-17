import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function PartnerSandboxPage() {
  await requireAdmin();
  const apps = await prisma.partnerSandboxApp.findMany({ take: 20 });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Partner sandbox</h1>
      <p className="text-muted-foreground">
        Test developer apps cannot access production participant data.
      </p>
      <ul className="space-y-2">
        {apps.map((a) => (
          <li key={a.id} className="rounded-lg border p-3">
            {a.name} — {a.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
