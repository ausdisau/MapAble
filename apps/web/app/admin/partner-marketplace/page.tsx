import { requireAdmin } from "@/lib/auth/guards";
import { phase8Config } from "@/lib/config/phase8";
import { prisma } from "@/lib/prisma";

export default async function PartnerMarketplaceAdminPage() {
  await requireAdmin();
  const listings = await prisma.partnerMarketplaceListing.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Partner marketplace</h1>
      {!phase8Config.partnerMarketplaceEnabled ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
          PARTNER_MARKETPLACE_ENABLED is false.
        </p>
      ) : null}
      <ul className="space-y-2">
        {listings.map((l) => (
          <li key={l.id} className="rounded border p-3">
            {l.title} — {l.category} ({l.status})
          </li>
        ))}
      </ul>
    </div>
  );
}
