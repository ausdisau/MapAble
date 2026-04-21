import { MessageCircle, FileText, Clock } from "lucide-react";
import type { RecentConversation, SavedDraft, PendingAction } from "./types";

function formatTime(value: string | Date): string {
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    return d.toLocaleString();
  } catch {
    return "";
  }
}

interface HistoryTabProps {
  recentConversations: RecentConversation[];
  savedDrafts: SavedDraft[];
  pendingActions: PendingAction[];
  onOpenConversation: (id: string) => void;
  onOpenDraft: (id: string) => void;
  onOpenPendingAction: (id: string) => void;
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-xs text-muted-foreground py-3 px-1" data-testid="text-history-empty">
      {message}
    </p>
  );
}

export function HistoryTab({
  recentConversations,
  savedDrafts,
  pendingActions,
  onOpenConversation,
  onOpenDraft,
  onOpenPendingAction,
}: HistoryTabProps) {
  return (
    <div className="p-4 space-y-6 overflow-auto" data-testid="widget-history-tab">
      <section aria-labelledby="history-recent-heading">
        <h3
          id="history-recent-heading"
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5"
        >
          <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" /> Recent conversations
        </h3>
        {recentConversations.length === 0 ? (
          <EmptyState message="No recent conversations yet." />
        ) : (
          <ul className="space-y-1">
            {recentConversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onOpenConversation(c.id)}
                  className="w-full text-left px-3 py-2 rounded-md border border-border hover-elevate min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#1B6EB5]/50"
                  data-testid={`button-history-conversation-${c.id}`}
                >
                  <div className="text-sm truncate">{c.title || "Untitled conversation"}</div>
                  <div className="text-[11px] text-muted-foreground">{formatTime(c.updatedAt)}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="history-drafts-heading">
        <h3
          id="history-drafts-heading"
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Saved drafts
        </h3>
        {savedDrafts.length === 0 ? (
          <EmptyState message="No saved drafts." />
        ) : (
          <ul className="space-y-1">
            {savedDrafts.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => onOpenDraft(d.id)}
                  className="w-full text-left px-3 py-2 rounded-md border border-border hover-elevate min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#1B6EB5]/50"
                  data-testid={`button-history-draft-${d.id}`}
                >
                  <div className="text-sm truncate">{d.title}</div>
                  <div className="text-[11px] text-muted-foreground line-clamp-1">{d.body}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="history-pending-heading">
        <h3
          id="history-pending-heading"
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5"
        >
          <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Pending actions
        </h3>
        {pendingActions.length === 0 ? (
          <EmptyState message="No pending actions." />
        ) : (
          <ul className="space-y-1">
            {pendingActions.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onOpenPendingAction(p.id)}
                  className="w-full text-left px-3 py-2 rounded-md border border-border hover-elevate min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#1B6EB5]/50"
                  data-testid={`button-history-pending-${p.id}`}
                >
                  <div className="text-sm">{p.label}</div>
                  {p.description && (
                    <div className="text-[11px] text-muted-foreground line-clamp-1">{p.description}</div>
                  )}
                  <div className="text-[11px] text-muted-foreground">{formatTime(p.updatedAt)}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
