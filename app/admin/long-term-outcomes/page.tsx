import { OutcomesWaveForm } from "@/app/admin/long-term-outcomes/OutcomesWaveForm";
import { requireAdmin } from "@/lib/auth/guards";
import { isLongTermOutcomesV2Enabled } from "@/lib/config/y5-rights-infrastructure";
import {
  getOutcomesDisclaimer,
  listPublishedOutcomes,
} from "@/lib/long-term-outcomes/outcomes-service";

export default async function LongTermOutcomesAdminPage() {
  await requireAdmin();
  const outcomes = await listPublishedOutcomes();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Long-term outcomes</h1>
      <p className="text-sm text-muted-foreground">{getOutcomesDisclaimer()}</p>
      {!isLongTermOutcomesV2Enabled() ? (
        <p className="text-amber-800">LONG_TERM_OUTCOMES_V2_ENABLED is false (phase9 fallback active).</p>
      ) : null}
      <OutcomesWaveForm />
      <ul className="space-y-2">
        {outcomes.map((o) => (
          <li key={o.id} className="rounded border p-3 text-sm">
            {o.outcomeKey} — {o.waveLabel ?? o.periodLabel}
            {o.suppressed ? " (suppressed)" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
