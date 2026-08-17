import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import {
  isParticipantAccessHistoryEnabled,
  isTrustFabricEnabled,
} from "@/lib/config/trust-fabric";
import { listParticipantAccessHistory } from "@/lib/trust/fabric/receipt-service";

import { AccessHistoryActions } from "./AccessHistoryActions";
import { ChallengeReceiptButton } from "./ChallengeReceiptButton";

export default async function AccessHistoryPage() {
  const user = await requireAuth();
  const enabled =
    isTrustFabricEnabled() && isParticipantAccessHistoryEnabled();

  if (!enabled) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <h1 className="font-heading text-2xl font-bold">Access history</h1>
        <p className="text-muted-foreground">
          Participant access history is not enabled in this environment
          (internal alpha). Contact support if you expected this page.
        </p>
        <p className="text-sm text-muted-foreground">
          <Link className="underline" href="/dashboard/consent">
            Open Consent centre
          </Link>
        </p>
      </div>
    );
  }

  const history = await listParticipantAccessHistory(user.id, user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Access history</h1>
        <p className="mt-2 text-muted-foreground">
          See who viewed categories of your information, why they accessed it,
          and whether their authority is still active. You can challenge future
          use or revoke consent.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Public claim state: internal alpha — not a certified trust network.
        </p>
      </div>

      <AccessHistoryActions />

      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No access receipts recorded yet.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border" aria-label="Access history">
          {history.map((item) => (
            <li key={item.id} className="space-y-2 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">{item.actorDisplayName}</p>
                  {item.organisationName ? (
                    <p className="text-sm text-muted-foreground">
                      {item.organisationName}
                    </p>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString("en-AU")}
                </p>
              </div>
              <p className="text-sm">
                <span className="font-medium">Why: </span>
                {item.purpose}
              </p>
              <p className="text-sm">
                <span className="font-medium">Categories: </span>
                {item.fieldCategories.join(", ")}
              </p>
              <p className="text-xs text-muted-foreground">
                Authority: {item.authoritySource}
                {" · "}
                {item.authorityActive ? "still active" : "not active"}
                {item.expiresAt
                  ? ` · expires ${new Date(item.expiresAt).toLocaleString("en-AU")}`
                  : ""}
                {" · "}
                outcome: {item.outcome}
                {item.challenged ? " · challenged" : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {item.canChallenge ? (
                  <ChallengeReceiptButton receiptId={item.id} />
                ) : null}
                {item.consentRecordId ? (
                  <Link
                    className="inline-flex h-10 items-center rounded-md border px-4 text-sm"
                    href="/dashboard/consent"
                  >
                    Revoke consent
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Challenging a receipt records your objection. Revoking consent in the{" "}
        <Link className="underline" href="/dashboard/consent">
          Consent centre
        </Link>{" "}
        stops future sharing. Past disclosures remain in your history for
        accountability.
      </p>
    </div>
  );
}
