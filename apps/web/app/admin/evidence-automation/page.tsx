import { requireAdmin } from "@/lib/auth/guards";

export default async function EvidenceAutomationPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Evidence automation</h1>
      <p className="text-muted-foreground">
        Collects compliance and security control snapshots — does not certify
        SOC 2 or ISO 27001.
      </p>
      <p className="text-sm">
        POST /api/admin/evidence-automation to run a collection job.
      </p>
    </div>
  );
}
