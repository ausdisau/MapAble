import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { listConversationsForUser } from "@/lib/messages/message-service";

export const metadata = { title: "Messages | MapAble" };

export default async function MessagesPage() {
  const user = await requireAuth();
  const conversations = await listConversationsForUser(user.id, isAdminRole(user.primaryRole));
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Secure messages</h1>
      <p className="text-muted-foreground">Only people in each conversation can read messages.</p>
      <ul className="space-y-2">
        {conversations.map((c) => (
          <li key={c.id}>
            <Link href={`/dashboard/messages/${c.id}`} className="block rounded-lg border border-border bg-card p-4 hover:border-primary/40">
              <span className="font-medium">{c.title}</span>
              {c.lastMessageAt ? <p className="text-sm text-muted-foreground">Last activity: {new Date(c.lastMessageAt).toLocaleString("en-AU")}</p> : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
