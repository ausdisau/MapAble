import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { isProviderOpsEnabled } from "@/lib/config/provider-ops";

export const metadata = {
  title: "Provider Operations | MapAble",
};

export default async function ProviderOpsPage({
  searchParams,
}: {
  searchParams: Promise<{ organisationId?: string }>;
}) {
  await requireAuth();
  const { organisationId } = await searchParams;
  const enabled = isProviderOpsEnabled();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Provider Operations</h1>
      <p className="mt-2 text-neutral-700">
        What requires human attention today, why, who owns it, and what happens
        if it remains unresolved. This console is read-only.
      </p>
      {!enabled ? (
        <p className="mt-6 rounded border border-amber-300 bg-amber-50 p-4 text-sm">
          Provider Operations is not enabled in this environment
          (`MAPABLE_PROVIDER_OPS_ENABLED`).
        </p>
      ) : !organisationId ? (
        <p className="mt-6 text-sm text-neutral-600">
          Provide <code>organisationId</code> as a query parameter to load the
          attention queue via{" "}
          <code>/api/provider-ops/attention?organisationId=…</code>.
        </p>
      ) : (
        <p className="mt-6 text-sm">
          Queue API:{" "}
          <Link
            className="underline"
            href={`/api/provider-ops/attention?organisationId=${encodeURIComponent(organisationId)}`}
          >
            /api/provider-ops/attention
          </Link>
        </p>
      )}
      <ul className="mt-8 list-disc space-y-2 pl-5 text-sm text-neutral-700">
        <li>Essential shift unfilled</li>
        <li>Worker credential expired</li>
        <li>Transport at risk</li>
        <li>Rejected invoice</li>
        <li>Incident deadline</li>
        <li>Communication requirement not acknowledged</li>
      </ul>
    </main>
  );
}
