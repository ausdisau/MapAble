import { requireAdmin } from "@/lib/auth/guards";
import { phase5Config } from "@/lib/config/phase5";

export default async function NdiaReadinessPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">NDIA API readiness</h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950 dark:text-amber-100">
        <strong>Not submitted to NDIA.</strong> Evidence bundles and dry-runs prepare
        for a future formally approved integration only.
      </p>
      <ul className="list-disc pl-6 text-sm">
        <li>Real submission: {phase5Config.ndiaRealSubmissionEnabled ? "enabled (should be false in pilot)" : "disabled"}</li>
        <li>Readiness module: {phase5Config.ndiaReadinessEnabled ? "on" : "off"}</li>
      </ul>
    </div>
  );
}
