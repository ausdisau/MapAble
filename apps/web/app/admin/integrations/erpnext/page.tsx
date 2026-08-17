import { ERPNextSyncPanel } from "@/components/finance/ERPNextSyncPanel";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminErpnextPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">ERPNext</h1>
      <ERPNextSyncPanel />
    </div>
  );
}
