import { requireAdmin } from "@/lib/auth/guards";
import { phase7Config } from "@/lib/config/phase7";
import { prisma } from "@/lib/prisma";

export default async function PublicBetaAdminPage() {
  await requireAdmin();
  const cohorts = await prisma.publicBetaCohort.findMany({
    include: { _count: { select: { feedback: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Public beta</h1>
      {!phase7Config.publicBetaEnabled ? (
        <p>Set PUBLIC_BETA_ENABLED=true to collect beta feedback.</p>
      ) : (
        <ul className="space-y-2">
          {cohorts.map((c) => (
            <li key={c.id} className="rounded border p-3">
              {c.name} — {c._count.feedback} feedback items
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
