import { requireAdmin } from "@/lib/auth/guards";
import { phase7Config } from "@/lib/config/phase7";
import { prisma } from "@/lib/prisma";

export default async function GovernmentPortalsAdminPage() {
  await requireAdmin();
  const workspaces = await prisma.governmentPartnerWorkspace.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Government partner portals</h1>
      {!phase7Config.governmentPartnerPortalEnabled ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
          GOVERNMENT_PARTNER_PORTAL_ENABLED is false — partner UI remains disabled.
        </p>
      ) : null}
      <ul className="space-y-2">
        {workspaces.map((w) => (
          <li key={w.id} className="rounded-lg border p-3">
            {w.name} — {w.region ?? "region n/a"}
          </li>
        ))}
      </ul>
    </div>
  );
}
