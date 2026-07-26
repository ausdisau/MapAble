import Link from "next/link";

import type { PeersThread } from "@/lib/community/mapable-peers/seed-threads";

function formatActivity(iso: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function PeersThreadList({
  threads,
  roomPath,
}: {
  threads: PeersThread[];
  roomPath: string;
}) {
  if (threads.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        No threads yet in this room. When PEERS persistence launches, new posts will appear here in
        chronological order — never in a personalised “for you” order.
      </p>
    );
  }

  return (
    <ol className="space-y-3" aria-label="Discussions, most recent activity first">
      {threads.map((thread, index) => (
        <li key={thread.id}>
          <article className="rounded-lg border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                #{index + 1} in room order · {thread.replyCount}{" "}
                {thread.replyCount === 1 ? "reply" : "replies"}
              </span>
              <time
                className="text-xs text-muted-foreground"
                dateTime={thread.lastActivityAt}
              >
                Last activity {formatActivity(thread.lastActivityAt)}
              </time>
            </div>
            <h3 className="mt-2 font-semibold">
              <Link
                href={`${roomPath}#thread-${thread.id}`}
                className="text-foreground hover:text-primary focus-visible:underline"
              >
                {thread.title}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{thread.excerpt}</p>
            <p className="mt-2 text-xs text-muted-foreground">Started by {thread.authorLabel}</p>
          </article>
        </li>
      ))}
    </ol>
  );
}
