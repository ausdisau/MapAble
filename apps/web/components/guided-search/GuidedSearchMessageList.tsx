import { Loader2 } from "lucide-react";
import React from "react";

import { cn } from "@/app/lib/utils";
import type { ProviderFinderChatUIMessage } from "@/types/provider-finder-chat";

type Props = {
  listId: string;
  messages: ProviderFinderChatUIMessage[];
  isBusy?: boolean;
  error?: Error | null;
  emptyState?: React.ReactNode;
  compact?: boolean;
  className?: string;
  bottomRef?: React.Ref<HTMLDivElement>;
};

export function getTextFromChatMessage(
  message: ProviderFinderChatUIMessage,
): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

export function GuidedSearchMessageList({
  listId,
  messages,
  isBusy = false,
  error = null,
  emptyState = null,
  compact = false,
  className,
  bottomRef,
}: Props) {
  return (
    <div
      id={listId}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      className={cn(
        "flex flex-col gap-3 overflow-y-auto",
        compact ? "max-h-56 min-h-36 px-3 py-2" : "max-h-72 min-h-48 px-4 py-3",
        className,
      )}
    >
      {messages.length === 0 ? emptyState : null}

      {messages.map((message) => {
        const text = getTextFromChatMessage(message);
        if (!text) return null;
        const isUser = message.role === "user";
        return (
          <div
            key={message.id}
            className={cn(
              "max-w-[90%] rounded-lg px-3 py-2",
              compact ? "text-xs" : "text-sm",
              isUser
                ? "ml-auto bg-[#005B7F] text-white"
                : "bg-slate-100 text-[#0C1833]",
            )}
          >
            {text}
          </div>
        );
      })}

      {isBusy ? (
        <div
          className={cn(
            "flex items-center gap-2 text-muted-foreground",
            compact ? "text-[10px]" : "text-xs",
          )}
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Finding providers…
        </div>
      ) : null}

      {error ? (
        <p
          className={cn("text-destructive", compact ? "text-xs" : "text-sm")}
          role="alert"
        >
          {error.message}
        </p>
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}
