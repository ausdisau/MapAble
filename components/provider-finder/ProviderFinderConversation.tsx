/**
 * @deprecated Use GuidedSearchDialogue via ProviderFinderAskPanel or header GuidedSearch.
 * Kept for Slack streaming via POST /api/provider-finder/chat.
 */
"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { useCallback, useId, useRef, useState, useEffect } from "react";

import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  FinderInterpretationData,
  ProviderFinderChatUIMessage,
} from "@/types/provider-finder-chat";

type SessionFields = {
  query: string;
  location: string;
  providerName: string;
  serviceQuery: string;
  accessQuery: string;
};

type ProviderFinderConversationProps = {
  session: SessionFields;
  onInterpretation: (data: FinderInterpretationData) => void;
  onSearchFromChat?: () => void;
  className?: string;
  modelLabel?: string;
};

const STARTER_PROMPTS = [
  "Support worker near St Ives",
  "Wheelchair accessible transport tomorrow",
  "OT assessment with NDIS registration in Parramatta",
];

function getTextFromMessage(message: ProviderFinderChatUIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

export function ProviderFinderConversation({
  session,
  onInterpretation,
  onSearchFromChat,
  className,
  modelLabel,
}: ProviderFinderConversationProps) {
  const listId = useId();
  const inputId = useId();
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef(session);
  const [input, setInput] = useState("");

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const handleData = useCallback(
    (dataPart: { type: string; data?: unknown }) => {
      if (
        dataPart.type === "data-finderInterpretation" &&
        dataPart.data &&
        typeof dataPart.data === "object"
      ) {
        onInterpretation(dataPart.data as FinderInterpretationData);
      }
    },
    [onInterpretation],
  );

  const { messages, sendMessage, status, error } =
    useChat<ProviderFinderChatUIMessage>({
      transport: new DefaultChatTransport({
        api: "/api/provider-finder/chat",
        prepareSendMessagesRequest: ({ messages: chatMessages }) => ({
          body: {
            messages: chatMessages,
            session: sessionRef.current,
          },
        }),
      }),
      onData: handleData,
    });

  const isBusy = status === "streaming" || status === "submitted";

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function submitText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    setInput("");
    await sendMessage({ text: trimmed });
    requestAnimationFrame(scrollToBottom);
  }

  return (
    <Card
      variant="outlined"
      className={cn("flex flex-col overflow-hidden", className)}
    >
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <MessageCircle className="h-5 w-5 text-primary" aria-hidden />
        <div>
          <h2 className="font-heading text-base font-semibold">
            Chat to find providers
          </h2>
          <p className="text-xs text-muted-foreground">
            Describe what you need in plain language — I’ll set your search
            filters.
          </p>
        </div>
      </div>

      <div
        id={listId}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="flex max-h-72 min-h-48 flex-col gap-3 overflow-y-auto px-4 py-3"
      >
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Try one of these examples or type your own question:
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-full border border-border/80 bg-muted/40 px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted"
                  onClick={() => void submitText(prompt)}
                  disabled={isBusy}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((message) => {
          const text = getTextFromMessage(message);
          if (!text) return null;
          const isUser = message.role === "user";
          return (
            <div
              key={message.id}
              className={cn(
                "max-w-[90%] rounded-lg px-3 py-2 text-sm",
                isUser
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted/60 text-foreground",
              )}
            >
              {text}
            </div>
          );
        })}

        {isBusy ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Finding providers…
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error.message}
          </p>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <form
        className="flex gap-2 border-t border-border/60 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submitText(input);
        }}
      >
        <label className="sr-only" htmlFor={inputId}>
          Message MapAble Finder
        </label>
        <input
          id={inputId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Auslan support worker in Newcastle"
          disabled={isBusy}
          className="min-h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
          autoComplete="off"
        />
        <Button
          type="submit"
          variant="default"
          size="sm"
          disabled={isBusy || !input.trim()}
        >
          {isBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="h-4 w-4" aria-hidden />
          )}
          <span className="sr-only">Send</span>
        </Button>
        {onSearchFromChat ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={onSearchFromChat}
          >
            Show results
          </Button>
        ) : null}
      </form>
      {modelLabel === "gpt-oss-120b" ? (
        <p className="px-3 pb-3 text-xs text-muted-foreground" role="note">
          Responses powered by gpt-oss-120b
        </p>
      ) : null}
    </Card>
  );
}
