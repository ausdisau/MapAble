import { AdminServiceOpsCard } from "@/components/phase3/AdminServiceOpsCard";
import { AtRiskReasonPanel } from "@/components/phase3/AtRiskReasonPanel";
import { getAtRiskItems, getServiceOpsSummary } from "@/lib/admin/service-ops";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminServiceOpsPage() {
  await requireAdmin();
  const summary = await getServiceOpsSummary();
  const atRisk = await getAtRiskItems();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Service operations</h1>
        <p className="text-muted-foreground">
          Operational overview for care, transport and jobs. No bulk automation in
          Phase 3.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AdminServiceOpsCard
          title="Care awaiting review"
          count={summary.careAwaitingReview}
          href="/admin/service-ops/care"
          description="Submitted care requests needing admin review."
        />
        <AdminServiceOpsCard
          title="Shifts need worker"
          count={summary.shiftsAwaitingWorker}
          href="/admin/care/shifts"
          description="Scheduled shifts without an assigned worker."
        />
        <AdminServiceOpsCard
          title="Transport awaiting operator"
          count={summary.transportAwaitingOperator}
          href="/admin/service-ops/transport"
          description="Bookings waiting for operator response."
        />
        <AdminServiceOpsCard
          title="Jobs to publish"
          count={summary.jobsAwaitingPublish}
          href="/admin/service-ops/jobs"
          description="Draft listings awaiting admin publish."
        />
        <AdminServiceOpsCard
          title="Adjustment requests"
          count={summary.applicationsWithAdjustments}
          href="/admin/job-applications"
          description="Applications with sensitive adjustments not yet shared."
        />
        <AdminServiceOpsCard
          title="Shifts awaiting approval"
          count={summary.shiftsAwaitingApproval}
          href="/admin/care/shifts"
          description="Completed shifts waiting for participant approval."
        />
      </section>
      <section>
        <h2 className="font-heading text-xl font-semibold">At-risk items</h2>
        <AtRiskReasonPanel items={atRisk} />
      </section>
    </div>
  );
}
