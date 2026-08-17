import { N8nWebhookLog } from "@/components/automation/N8nWebhookLog";
import { N8nWorkflowTable } from "@/components/automation/N8nWorkflowTable";
import { requireAdmin } from "@/lib/auth/guards";
import { isN8nEnabled } from "@/lib/automation/n8n/n8n-client";
import { prisma } from "@/lib/prisma";

export default async function AdminN8nPage() {
  await requireAdmin();
  const events = await prisma.automationWebhookEvent.findMany({
    orderBy: { receivedAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">n8n automation</h1>
      <p className="text-sm text-muted-foreground">
        Low-risk admin automations only. Status: {isN8nEnabled() ? "enabled" : "disabled"}
      </p>
      <N8nWorkflowTable />
      <N8nWebhookLog events={events} />
    </div>
  );
}
