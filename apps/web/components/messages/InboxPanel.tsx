import Link from "next/link";

export function InboxPanel({
  conversations,
  activeId,
}: {
  conversations: Array<{
    id: string;
    title: string;
    lastMessageAt: Date | null;
  }>;
  activeId?: string;
}) {
  return (
    <nav aria-label="Message threads">
      <ul className="space-y-1">
        {conversations.map((c) => (
          <li key={c.id}>
            <Link
              href={`/messages/${c.id}`}
              className={`block rounded-md px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                activeId === c.id ? "bg-primary/10 font-medium" : "hover:bg-muted"
              }`}
              aria-current={activeId === c.id ? "page" : undefined}
            >
              {c.title}
              {c.lastMessageAt ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {c.lastMessageAt.toLocaleString()}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
