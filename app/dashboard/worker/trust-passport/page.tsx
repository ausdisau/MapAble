import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getTrustPassportSummary } from "@/lib/trust-passport/trust-passport-service";

import { TrustPassportActions } from "./TrustPassportActions";

export default async function WorkerTrustPassportPage() {
  const user = await requireAuth();
  const worker = await prisma.workerProfile.findFirst({
    where: { userId: user.id, active: true },
  });

  if (!worker) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <p className="text-muted-foreground">No active worker profile found.</p>
      </div>
    );
  }

  const summary = await getTrustPassportSummary(worker.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Trust passport (pilot)</h1>
      <p className="text-sm text-muted-foreground">
        {summary.pilotNotice ??
          "Present portable credentials to speed up verification. Pilot uses a mock issuer only."}
      </p>

      {!summary.enabled ? (
        <p className="text-sm">Trust passport pilot is not enabled in this environment.</p>
      ) : (
        <>
          <TrustPassportActions workerProfileId={worker.id} />
          <ul className="divide-y rounded-lg border">
            {summary.credentials.map((c) => (
              <li key={c.id} className="p-3 text-sm">
                <strong>{c.credentialType}</strong> — {c.status}
                {c.expiresAt ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · expires {c.expiresAt.toLocaleDateString("en-AU")}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
