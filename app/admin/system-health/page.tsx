import { requireAdmin } from "@/lib/auth/guards";

import { SystemHealthDashboard } from "./SystemHealthDashboard";

export default async function SystemHealthPage() {
  await requireAdmin();
  return <SystemHealthDashboard />;
}
