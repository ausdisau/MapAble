import { DelegateConsentInfo } from "@/components/engagement/DelegateConsentInfo";
import { requireAuth } from "@/lib/auth/guards";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { listMicroConsentsForParticipant } from "@/lib/consent/micro-consent-service";

import { RevokeConsentButton } from "./RevokeConsentButton";

export default async function ConsentCenterPage() {
  const user = await requireAuth();
  const consents = await listMicroConsentsForParticipant(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Consent center</h1>
        <p className="mt-2 text-muted-foreground">
          View and manage who can access your information. You can revoke access
          at any time.
        </p>
      </div>

      {isEngagementPlatformEnabled() ? <DelegateConsentInfo /> : null}

      {consents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No active micro-consent grants yet.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {consents.map((c) => (
            <li key={c.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{c.sourceAction ?? c.scopeLabel}</p>
                <p className="text-sm text-muted-foreground">{c.purpose}</p>
                <p className="text-xs text-muted-foreground">
                  Status: {c.status}
                  {c.shareMode ? ` · ${c.shareMode}` : ""}
                  {c.expiryDate
                    ? ` · expires ${c.expiryDate.toLocaleDateString("en-AU")}`
                    : ""}
                </p>
              </div>
              {c.status === "active" && <RevokeConsentButton consentId={c.id} />}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Revoking consent stops future sharing. Past actions already taken may
        remain in audit logs.
      </p>
    </div>
  );
}
