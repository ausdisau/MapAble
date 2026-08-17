import { requireAdmin } from "@/lib/auth/guards";
import { phase6Config } from "@/lib/config/phase6";

export default async function OpenDataPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Open data export</h1>
      {!phase6Config.openDataExportEnabled ? (
        <p className="rounded-lg border p-4">
          Open data export is disabled. Set OPEN_DATA_EXPORT_ENABLED=true for
          approved pilot exports only.
        </p>
      ) : (
        <p className="text-muted-foreground">
          Privacy-safe accessibility insights with suppression for small counts.
        </p>
      )}
    </div>
  );
}
