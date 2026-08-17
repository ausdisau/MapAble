import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminCompliancePage() {
  await requireAdmin();
  const controls = await prisma.complianceControl.findMany({ take: 30 });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Compliance controls</h1>
      <p className="text-muted-foreground">
        Evidence and retention dry-runs — not legal certification.
      </p>
      <ul className="space-y-2">
        {controls.map((c) => (
          <li key={c.id} className="rounded-lg border p-3">
            <strong>{c.code}</strong> — {c.title} ({c.status})
          </li>
        ))}
      </ul>
    </div>
  );
}
