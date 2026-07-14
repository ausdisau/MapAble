import { requireAdmin } from "@/lib/auth/guards";
import { UNIFIED_PROHIBITED_USES } from "@/lib/careos/policy/unified-prohibited-uses";

export const metadata = { title: "AI safety gate | Admin" };

export default async function SafetyGatePage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">
          CareOS AI safety evaluation gate
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Continuous assurance uses the evaluation harness and the unified
          prohibited-use registry. Run{" "}
          <code className="text-xs">POST /api/admin/safety-gate/run</code> or the
          CareOS CI safety-gate job. This gate never makes care, payment, or
          eligibility decisions.
        </p>
      </header>

      <section>
        <h2 className="text-lg font-semibold">Unified prohibited uses</h2>
        <ul className="mt-3 list-disc pl-5 text-sm">
          {UNIFIED_PROHIBITED_USES.map((use) => (
            <li key={use}>
              <code>{use}</code>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
