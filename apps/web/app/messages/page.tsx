import { redirect } from "next/navigation";

import { CommunicationCentreShell } from "@/components/messages/CommunicationCentreShell";
import { InboxPanel } from "@/components/messages/InboxPanel";
import { requireAuth } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { listConversationsForUser } from "@/lib/messages/message-service";

export const metadata = { title: "Communication Centre | MapAble" };

export default async function MessagesHubPage() {
  const user = await requireAuth();
  const conversations = await listConversationsForUser(
    user.id,
    isAdminRole(user.primaryRole)
  );

  if (conversations.length === 1) {
    redirect(`/messages/${conversations[0].id}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Communication Centre</h1>
      <p className="text-sm text-muted-foreground">
        Secure, consent-aware messaging. Select a conversation to continue.
      </p>
      <CommunicationCentreShell
        sidebar={
          <InboxPanel
            conversations={conversations.map((c) => ({
              id: c.id,
              title: c.title,
              lastMessageAt: c.lastMessageAt,
            }))}
          />
        }
        main={
          <p className="p-8 text-muted-foreground">
            Choose a thread from the inbox to view messages.
          </p>
        }
      />
    </div>
  );
}
