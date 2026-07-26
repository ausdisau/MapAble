import { requireAdmin } from "@/lib/auth/guards";
import { listPublishedImpactWaves } from "@/lib/research/longitudinal-impact/impact-wave-service";

export default async function LongitudinalImpactPage() {
  await requireAdmin();
  const waves = await listPublishedImpactWaves();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Longitudinal impact</h1>
      <ul className="space-y-2">
        {waves.map((w) => (
          <li key={w.id} className="rounded border p-3">
            {w.waveLabel} — {w.status}
            {w.suppressed ? " (suppressed)" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
