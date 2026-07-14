import {
  DelegateInvitationList,
  DelegateInviteForm,
} from "@/components/authority/DelegateControls";
import { requireAuth } from "@/lib/auth/guards";
import { listDelegateInvitations } from "@/lib/delegation/delegate-invitation-service";
import { identityAuthorityConfig } from "@/lib/config/identity-authority";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Delegates | Participant" };

export default async function ParticipantDelegatesPage() {
  const participant = await requireAuth();

  const [sent, receivedRaw] = await Promise.all([
    listDelegateInvitations(participant.id),
    prisma.delegateInvitation.findMany({
      where: {
        OR: [
          { inviteeUserId: participant.id },
          { inviteeEmail: participant.email.toLowerCase() },
        ],
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const serialize = (invitation: (typeof sent)[number]) => ({
    id: invitation.id,
    inviteeEmail: invitation.inviteeEmail,
    roleType: invitation.roleType,
    proposedDomain: invitation.proposedDomain,
    proposedActions: invitation.proposedActions,
    status: invitation.status,
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
  });

  return (
    <section
      aria-labelledby="participant-delegates-heading"
      className="mx-auto max-w-3xl space-y-8 p-4"
    >
      <header>
        <h1
          id="participant-delegates-heading"
          className="font-heading text-3xl font-bold"
        >
          Delegates
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Invite trusted people to help with specific tasks. Financial and
          clinical access always requires a separate explicit grant — they cannot
          be delegated through a simple invitation.
        </p>
      </header>

      {!identityAuthorityConfig.delegateInvitesEnabled ? (
        <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Delegate invitations are not enabled in this environment. Contact your
          administrator if you need this feature.
        </p>
      ) : (
        <DelegateInviteForm />
      )}

      <DelegateInvitationList
        sent={sent.map(serialize)}
        received={receivedRaw.map(serialize)}
      />
    </section>
  );
}
