import { AgentRunsAdmin } from "@/components/admin/back-of-house/AgentRunsAdmin";
import { requireAdminScope } from "@/lib/auth/guards";

export const metadata = { title: "Agent runs ops | MapAble Admin" };

export default async function AdminOpsAgentRunsPage() {
  await requireAdminScope("admin:agent-runs:read");
  return <AgentRunsAdmin />;
}
