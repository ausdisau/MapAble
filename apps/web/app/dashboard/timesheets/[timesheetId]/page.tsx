import { notFound } from "next/navigation";

import { TimesheetApprovalPanel } from "@/components/phase4/TimesheetApprovalPanel";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function TimesheetDetailPage({
  params,
}: {
  params: Promise<{ timesheetId: string }>;
}) {
  const user = await requireAuth();
  const { timesheetId } = await params;
  const ts = await prisma.timesheet.findFirst({
    where: { id: timesheetId, participantId: user.id },
  });
  if (!ts) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Support record review</h1>
      <dl className="grid gap-2 text-sm">
        <div>
          <dt className="font-medium">Scheduled</dt>
          <dd>
            {ts.scheduledStart.toLocaleString("en-AU")} –{" "}
            {ts.scheduledEnd.toLocaleString("en-AU")}
          </dd>
        </div>
        <div>
          <dt className="font-medium">Status</dt>
          <dd>{ts.status.replace(/_/g, " ")}</dd>
        </div>
      </dl>
      {ts.status === "submitted" && (
        <TimesheetApprovalPanel
          timesheetId={ts.id}
          organisationId={ts.organisationId}
        />
      )}
    </div>
  );
}
