import { requireAdmin } from "@/lib/auth/guards";
import { getReleaseHardeningStatus } from "@/lib/platform/mobile-release/release-hardening-service";

export default async function MobileReleaseAdminPage() {
  await requireAdmin();
  const candidates = await getReleaseHardeningStatus();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Mobile release hardening</h1>
      <p className="text-muted-foreground">
        Release candidates and blockers must be resolved before store submission.
      </p>
      <ul className="space-y-3">
        {candidates.map((c) => (
          <li key={c.id} className="rounded-lg border p-4">
            <strong>
              {c.platform} {c.version}
            </strong>
            <span className="ml-2 text-sm">({c.releaseStatus})</span>
            <ul className="mt-2 text-sm">
              {c.blockers.map((b) => (
                <li key={b.id}>
                  {b.code} — {b.resolved ? "resolved" : "open"}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
