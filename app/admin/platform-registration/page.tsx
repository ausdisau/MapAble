import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { listPlatformRegistrationPacks } from "@/lib/careos/opportunities/platform-registration-pack";
import { careosOpportunitiesConfig } from "@/lib/config/careos-opportunities";

export const metadata = { title: "Platform registration | Admin" };

export default async function PlatformRegistrationPage() {
  await requireAdmin();
  const packs = careosOpportunitiesConfig.platformRegistrationEnabled
    ? await listPlatformRegistrationPacks()
    : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">
          NDIS digital platform registration pack
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Human evidence preparation for Commission platform-provider
          registration. Does not submit claims, determine eligibility, or contact
          the NDIS Commission automatically.
        </p>
      </header>

      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950 dark:text-amber-100">
        <strong>Claim submission:</strong>{" "}
        {careosOpportunitiesConfig.automatedClaimSubmissionEnabled
          ? "ENABLED (unsafe — must be false)"
          : "disabled (required)"}
        . Export via{" "}
        <code className="text-xs">POST /api/admin/platform-registration/[id]/export</code>.
      </p>

      <ul className="space-y-3">
        {packs.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            No packs yet. Create one with{" "}
            <code className="text-xs">POST /api/admin/platform-registration</code>.
          </li>
        ) : (
          packs.map((pack) => (
            <li
              key={pack.id}
              className="rounded-lg border p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold">{pack.title}</h2>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {pack.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Items: {pack.items.length} · claimSubmissionEnabled={" "}
                {String(pack.claimSubmissionEnabled)}
              </p>
              <ul className="mt-3 list-disc pl-5 text-sm">
                {pack.items.map((item) => (
                  <li key={item.id}>
                    {item.label} — <em>{item.status}</em>
                  </li>
                ))}
              </ul>
            </li>
          ))
        )}
      </ul>

      <p className="text-sm">
        Related:{" "}
        <Link className="underline" href="/admin/ndia-readiness">
          NDIA API readiness
        </Link>
      </p>
    </div>
  );
}
