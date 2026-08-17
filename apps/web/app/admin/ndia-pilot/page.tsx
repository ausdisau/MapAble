import { requireAdmin } from "@/lib/auth/guards";
import { getNdiaPilotStatus } from "@/lib/ndis/pilot/ndia-pilot-service";

export default async function NdiaPilotAdminPage() {
  await requireAdmin();
  const status = await getNdiaPilotStatus();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">NDIA pilot</h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
        {status.message}
      </p>
      <p className="text-sm">
        Pilot enabled: {String(status.pilotEnabled)} — Approval on file:{" "}
        {String(status.approval.approved)}
      </p>
    </div>
  );
}
