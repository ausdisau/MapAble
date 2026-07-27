import { AuthoritySummary } from "@/components/authority/AuthoritySummary";
import { PeopleWithAccess } from "@/components/authority/PeopleWithAccess";
import { ConsentWalletPanel } from "@/components/consent-wallet/ConsentWalletPanel";
import { ConsentTimeline } from "@/components/privacy/ConsentTimeline";
import { requireAuth } from "@/lib/auth/guards";
import {
  listAuthorityDecisionsForParticipant,
  listPeopleWithAccess,
} from "@/lib/authority/authority-decision-service";
import { listWalletCredentials } from "@/lib/careos/opportunities/consent-wallet";
import { listConsentTimeline } from "@/lib/consent/consent-receipt-service";
import { careosOpportunitiesConfig } from "@/lib/config/careos-opportunities";

export const metadata = { title: "Privacy & access | Participant" };

export default async function ParticipantPrivacyPage() {
  const participant = await requireAuth();

  const [grants, consentReceipts, decisions, wallet] = await Promise.all([
    listPeopleWithAccess(participant.id),
    listConsentTimeline(participant.id, participant.id),
    listAuthorityDecisionsForParticipant(participant.id, participant.id),
    careosOpportunitiesConfig.consentWalletEnabled
      ? listWalletCredentials(participant.id)
      : Promise.resolve({
          authority: [],
          documents: [],
          preferentialReceipts: [],
        }),
  ]);

  const serializedGrants = grants.map((grant: (typeof grants)[number]) => ({
    id: grant.id,
    domain: grant.domain,
    actions: grant.actions,
    consentScopes: grant.consentScopes,
    purpose: grant.purpose,
    recipientRole: grant.recipientRole,
    expiresAt: grant.expiresAt?.toISOString() ?? "",
    delegate: grant.delegate,
  }));

  const serializedReceipts = consentReceipts.map(
    (receipt: (typeof consentReceipts)[number]) => ({
      id: receipt.id,
      scope: receipt.scope,
      purpose: receipt.purpose,
      action: receipt.action,
      recipientType: receipt.recipientType,
      createdAt: receipt.createdAt.toISOString(),
    }),
  );

  const serializedDecisions = decisions.map(
    (decision: (typeof decisions)[number]) => ({
      id: decision.id,
      domain: decision.domain,
      action: decision.action,
      decision: decision.decision,
      reason: decision.reason,
      purpose: decision.purpose,
      createdAt: decision.createdAt.toISOString(),
    }),
  );

  return (
    <section
      aria-labelledby="participant-privacy-heading"
      className="mx-auto max-w-3xl space-y-8 p-4"
    >
      <header>
        <h1
          id="participant-privacy-heading"
          className="font-heading text-3xl font-bold"
        >
          Privacy and access
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          See who can act on your behalf, review consent activity, and
          understand how authority decisions are recorded. You can revoke access
          at any time.
        </p>
      </header>

      {careosOpportunitiesConfig.consentWalletEnabled ? (
        <section aria-labelledby="consent-wallet-heading">
          <h2 id="consent-wallet-heading" className="text-lg font-semibold">
            Consent and credential wallet
          </h2>
          <div className="mt-4">
            <ConsentWalletPanel
              authority={wallet.authority.map((grant) => ({
                id: grant.id,
                domain: grant.domain,
                actions: grant.actions,
                purpose: grant.purpose,
                expiresAt: grant.expiresAt?.toISOString() ?? "",
                delegate: grant.delegate,
              }))}
              documents={wallet.documents.map((doc) => ({
                id: doc.id,
                documentId: doc.documentId,
                purpose: doc.purpose,
                expiresAt: doc.expiresAt.toISOString(),
              }))}
              preferentialReceipts={wallet.preferentialReceipts.map(
                (receipt) => ({
                  id: receipt.id,
                  scope: receipt.scope,
                  purpose: receipt.purpose,
                  action: receipt.action,
                  createdAt: receipt.createdAt.toISOString(),
                }),
              )}
            />
          </div>
        </section>
      ) : null}

      <section aria-labelledby="people-with-access-heading">
        <h2 id="people-with-access-heading" className="text-lg font-semibold">
          People with access
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Active delegates who can perform allowed actions in specific domains.
        </p>
        <div className="mt-4">
          <PeopleWithAccess grants={serializedGrants} />
        </div>
      </section>

      <section aria-labelledby="consent-timeline-heading">
        <h2 id="consent-timeline-heading" className="text-lg font-semibold">
          Consent timeline
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A chronological record of consent grants, uses, and revocations.
        </p>
        <div className="mt-4">
          <ConsentTimeline receipts={serializedReceipts} />
        </div>
      </section>

      <section aria-labelledby="authority-summary-heading">
        <h2 id="authority-summary-heading" className="text-lg font-semibold">
          Authority decisions
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Summary of allow and deny decisions when someone tries to act on your
          behalf.
        </p>
        <div className="mt-4">
          <AuthoritySummary decisions={serializedDecisions} />
        </div>
      </section>
    </section>
  );
}
