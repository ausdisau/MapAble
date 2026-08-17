import Link from "next/link";

import { CoreHubCard } from "@/components/core/CoreHubCard";
import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { roleLabel } from "@/lib/auth/roles";
import { getEnterpriseWorkspaceSummaryV2 } from "@/lib/provider/enterprise/workspace-v2-service";
import { getProviderControlPanelSummaryForUser } from "@/lib/provider/provider-control-panel-service";

export const metadata = { title: "Provider control panel | MapAble" };

function MetricTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {detail ? (
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      ) : null}
    </div>
  );
}

export default async function ProviderControlPanelPage() {
  const user = await requireAuth();
  await requirePermission("care:read:org");

  const panelSummary = await getProviderControlPanelSummaryForUser(user);
  const primary = panelSummary.primaryOrganisation;

  const enterprise =
    hasPermission(user.primaryRole, "enterprise:console") &&
    primary?.organisationId
      ? await getEnterpriseWorkspaceSummaryV2(primary.organisationId, user)
      : null;

  const showOnboardingAlert =
    primary && !primary.onboardingReady && primary.onboardingBlockerCount > 0;

  const showServiceReadyBadge = primary != null;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold">
          Your provider control panel
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Signed in as <strong>{roleLabel(user.primaryRole)}</strong>
          {primary ? (
            <>
              {" "}
              for <strong>{primary.organisationName}</strong>
            </>
          ) : (
            ". Link your account to an organisation to see metrics."
          )}
        </p>
      </header>

      {showServiceReadyBadge && primary ? (
        <div
          className={
            primary.serviceReady
              ? "rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3"
              : "rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3"
          }
          role="status"
        >
          <p className="font-medium">
            {primary.serviceReady
              ? "Service-ready — you can receive care assignments"
              : `Not service-ready — ${primary.serviceReadyBlockerCount} blocker${
                  primary.serviceReadyBlockerCount === 1 ? "" : "s"
                } remaining`}
          </p>
          {!primary.serviceReady ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Complete verification, onboarding, and verify at least one active
              worker before MapAble assigns care requests to your organisation.
            </p>
          ) : null}
          <Link
            href="/provider/onboarding"
            className="mt-2 inline-block text-sm font-semibold text-primary underline"
          >
            {primary.serviceReady ? "Review readiness" : "Fix blockers"} →
          </Link>
        </div>
      ) : null}

      {showOnboardingAlert ? (
        <div
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3"
          role="alert"
        >
          <p className="font-medium text-amber-950 dark:text-amber-100">
            Onboarding incomplete — {primary.onboardingBlockerCount} blocker
            {primary.onboardingBlockerCount === 1 ? "" : "s"} remaining
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete provider onboarding before matching participants.
          </p>
          <Link
            href="/provider/onboarding"
            className="mt-2 inline-block text-sm font-semibold text-primary underline"
          >
            Continue onboarding →
          </Link>
        </div>
      ) : null}

      {primary ? (
        <section aria-label="Organisation metrics">
          <h2 className="mb-4 text-lg font-semibold">At a glance</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricTile
              label="Active workers"
              value={primary.activeWorkers}
              detail={
                primary.pendingVerificationWorkers
                  ? `${primary.pendingVerificationWorkers} pending verification`
                  : undefined
              }
            />
            <MetricTile
              label="Pending invites"
              value={primary.pendingInvites}
            />
            <MetricTile
              label="Assigned bookings"
              value={primary.assignedBookings}
            />
            <MetricTile
              label="Open care requests"
              value={primary.openCareRequests}
            />
            <MetricTile
              label="Upcoming shifts (7d)"
              value={primary.upcomingShifts7d}
            />
            <MetricTile
              label="Roster gaps (72h)"
              value={primary.unassignedShifts72h}
              detail={
                primary.unassignedShifts72h
                  ? "Unassigned shifts starting soon"
                  : undefined
              }
            />
          </div>
        </section>
      ) : null}

      {enterprise && "openRecoveries" in enterprise ? (
        <section
          id="enterprise-workspace"
          aria-label="Enterprise metrics"
          className="scroll-mt-8"
        >
          <h2 className="mb-4 text-lg font-semibold">Enterprise workspace</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile
              label="Care shifts"
              value={enterprise.careShifts ?? 0}
            />
            <MetricTile
              label="Open recoveries"
              value={enterprise.openRecoveries ?? 0}
            />
            <MetricTile
              label="Recon exceptions"
              value={enterprise.openReconciliationExceptions ?? 0}
            />
            <MetricTile
              label="Roster gaps (72h)"
              value={enterprise.rosterGaps ?? 0}
            />
          </div>
          <nav
            aria-label="Enterprise operations"
            className="mt-4 flex flex-wrap gap-4 text-sm"
          >
            <Link href="/provider/care" className="font-medium text-primary underline">
              Care operations
            </Link>
            <Link
              href="/provider/transport"
              className="font-medium text-primary underline"
            >
              Transport operations
            </Link>
            <Link
              href="/provider/ndis-claims/reconciliation"
              className="font-medium text-primary underline"
            >
              Reconciliation
            </Link>
          </nav>
        </section>
      ) : null}

      <section aria-label="Quick links">
        <h2 className="mb-4 text-lg font-semibold">Quick links</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CoreHubCard
            title="Workers & invites"
            description={
              primary
                ? `${primary.activeWorkers} active · ${primary.pendingInvites} pending invite(s)`
                : "Manage your support worker roster"
            }
            href="/provider/workers"
          />
          <CoreHubCard
            title="Care inbox"
            description={
              primary?.openCareRequests
                ? `${primary.openCareRequests} open request(s)`
                : "Review assigned care requests"
            }
            href="/provider/care/requests"
          />
          <CoreHubCard
            title="Roster"
            description={
              primary?.unassignedShifts72h
                ? `${primary.unassignedShifts72h} gap(s) in the next 72 hours`
                : "View and manage care roster"
            }
            href="/provider/care/roster"
          />
          <CoreHubCard
            title="Bookings"
            description={
              primary?.assignedBookings
                ? `${primary.assignedBookings} assigned booking(s)`
                : "Provider booking requests"
            }
            href="/provider/bookings"
          />
          <CoreHubCard
            title="Billing"
            description="Invoices and organisation billing"
            href="/provider/billing"
          />
          <CoreHubCard
            title="Claiming"
            description="NDIS plan-managed and NDIA direct claiming"
            href="/provider/claiming"
          />
          <CoreHubCard
            title="Calendar"
            description="Shifts, availability and scheduled care"
            href="/provider/calendar"
          />
          <CoreHubCard
            title="Insights"
            description="Benchmarks, reports and capacity"
            href="/provider/insights"
          />
        </div>
      </section>
    </div>
  );
}
