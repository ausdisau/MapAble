import { requireAdmin } from "@/lib/auth/guards";
import { listThinMarketSignals } from "@/lib/careos/opportunities/thin-market-continuity";
import { careosOpportunitiesConfig } from "@/lib/config/careos-opportunities";

export const metadata = { title: "Thin-market continuity | Admin" };

export default async function ThinMarketPage() {
  await requireAdmin();
  const signals = careosOpportunitiesConfig.thinMarketContinuityEnabled
    ? await listThinMarketSignals({})
    : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">
          Thin-market continuity
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Capacity signals use Available / Limited / Unknown / Escalate only.
          Participant risk scores and automatic provider selection are forbidden.
        </p>
      </header>

      <ul className="space-y-3">
        {signals.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            No signals recorded. Use{" "}
            <code className="text-xs">POST /api/admin/thin-market</code>.
          </li>
        ) : (
          signals.map((signal) => (
            <li key={signal.id} className="rounded-lg border p-4 text-sm">
              <strong>
                {signal.regionKey} · {signal.serviceCategory}
              </strong>
              <div className="mt-1">
                Status: {signal.capacityStatus}
                {signal.requiresHumanConfirmation
                  ? " (awaiting human confirmation)"
                  : " (confirmed)"}
              </div>
              {signal.notes ? (
                <p className="mt-2 text-muted-foreground">{signal.notes}</p>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
