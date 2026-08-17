import Link from "next/link";

import {
  isAssessorNetworkPilotEnabled,
  listAssessorVerificationQueue,
} from "@/lib/assessor/network/assessor-network-pilot-service";
import { getAssessorNetworkDirectory } from "@/lib/assessor/network/network-service";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AssessorNetworkPage() {
  await requireAdmin();
  const [members, pending] = await Promise.all([
    getAssessorNetworkDirectory(),
    isAssessorNetworkPilotEnabled()
      ? listAssessorVerificationQueue()
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Assessor network</h1>

      {pending.length > 0 && (
        <section>
          <h2 className="font-medium">Verification queue</h2>
          <ul className="mt-2 space-y-2">
            {pending.map((m) => (
              <li key={m.id} className="rounded border p-3 text-sm">
                User {m.userId.slice(0, 8)} — {m.region ?? m.regions.join(", ")} ·
                pending verification
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-medium">Active roster</h2>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id} className="rounded border p-3 text-sm">
              User {m.userId.slice(0, 8)} — {m.regions.join(", ") || m.region || "all regions"}
              {m.credentialVerifiedAt ? " · verified" : ""}
              {m.capacity != null ? ` · capacity ${m.capacity}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <Link href="/assessor" className="text-sm text-primary underline">
        Assessor portal
      </Link>
    </div>
  );
}
