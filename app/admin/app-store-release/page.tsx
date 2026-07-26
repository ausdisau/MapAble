import { getAppStoreReleaseDashboard } from "@/lib/platform/app-store-release/release-process-service";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AppStoreReleaseAdminPage() {
  await requireAdmin();
  const submissions = await getAppStoreReleaseDashboard();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">App store release process</h1>
      <ul className="space-y-3">
        {submissions.map((s) => (
          <li key={s.id} className="rounded-lg border p-4">
            {s.platform} {s.version} — {s.status}
            <p className="text-sm">
              Checklist: {s.checklistItems.filter((i) => i.completed).length}/
              {s.checklistItems.length} — {s.ready ? "ready" : "blocked"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
