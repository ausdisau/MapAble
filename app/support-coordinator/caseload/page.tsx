import Link from "next/link";

import { CaseloadDashboard } from "@/components/coordinator/CaseloadDashboard";
import { EnquiryPanel } from "@/components/coordinator/EnquiryPanel";
import { TaskBoard } from "@/components/coordinator/TaskBoard";
import { requirePermission } from "@/lib/auth/guards";
import { supportCoordinationConfig } from "@/lib/config/support-coordination";
import { listCaseload } from "@/lib/support-coordination/coordination-case-service";
import { listEnquiriesForCoordinator } from "@/lib/support-coordination/provider-enquiry-service";

export default async function CoordinatorCaseloadPage() {
  const user = await requirePermission("coordinator:portal");
  const enabled = supportCoordinationConfig.enabled;

  const rawCases = enabled
    ? await listCaseload(user.id).catch(() => [])
    : [];

  const cases = rawCases.map((c) => ({
    id: c.id,
    title: c.title,
    status: c.status,
    operationalPriority: c.operationalPriority,
    participantName: c.participant.name,
    openTaskCount: c.tasks.length,
    waitingOnTaskCount: c.waitingOnTaskCount,
  }));

  const tasks = rawCases.flatMap((c) =>
    c.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      waitingOn: t.waitingOn,
      dueAt: t.dueAt?.toISOString() ?? null,
      caseTitle: c.title,
    })),
  );

  const enquiries = enabled && supportCoordinationConfig.enquiriesEnabled
    ? (await listEnquiriesForCoordinator(user.id).catch(() => [])).map((e) => ({
        id: e.id,
        providerName: e.providerName,
        status: e.status,
        disclosurePreview: e.disclosurePreview,
        responseDeadline: e.responseDeadline?.toISOString() ?? null,
      }))
    : [];

  return (
    <div className="space-y-8 p-4">
      <Link className="text-primary text-sm underline" href="/support-coordinator">
        Back to portal
      </Link>
      <header>
        <h1 className="font-heading text-2xl font-bold">Caseload dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Operational priority only — not participant risk scoring. You act
          within recorded authority for each participant.
        </p>
      </header>

      <CaseloadDashboard cases={cases} enabled={enabled} />
      <TaskBoard tasks={tasks} />
      <EnquiryPanel
        enquiries={enquiries}
        enabled={supportCoordinationConfig.enquiriesEnabled}
      />
    </div>
  );
}
