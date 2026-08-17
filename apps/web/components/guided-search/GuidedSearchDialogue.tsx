"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/app/lib/utils";
import { AskProviderResultSnippets } from "@/components/provider-finder/AskProviderResultSnippets";
import { AccessibleAutocomplete } from "@/components/search/AccessibleAutocomplete";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CopilotProviderResult } from "@/lib/copilot/types";
import { buildFinderSearchParams } from "@/lib/search/apply-interpretation";
import type {
  FinderAgentData,
  FinderInterpretationData,
  ProviderFinderChatUIMessage,
} from "@/types/provider-finder-chat";

import { GuidedSearchChoiceChips } from "./GuidedSearchChoiceChips";
import { GuidedSearchComposer } from "./GuidedSearchComposer";
import { GuidedSearchMessageList } from "./GuidedSearchMessageList";
import { GuidedSearchSlotProgress } from "./GuidedSearchSlotProgress";
import {
  applyChoiceToSession,
  getOrCreateGuidedSearchSessionId,
  type GuidedSearchSessionFields,
} from "./types";

export type GuidedSearchDialogueVariant = "compact" | "full";

type Props = {
  session: GuidedSearchSessionFields;
  onSessionChange?: (session: GuidedSearchSessionFields) => void;
  onInterpretation: (data: FinderInterpretationData) => void;
  onAgentMeta?: (data: FinderAgentData) => void;
  onShowResults?: () => void;
  initialMessage?: string;
  variant?: GuidedSearchDialogueVariant;
  className?: string;
  showHeader?: boolean;
  starterPrompts?: string[];
  /** Safe model display name when gpt-oss powers replies. */
  modelLabel?: string;
};

const DEFAULT_STARTERS = [
  "Support worker near St Ives",
  "Wheelchair accessible transport tomorrow",
  "OT assessment with NDIS registration in Parramatta",
];

export function GuidedSearchDialogue({
  session,
  onSessionChange,
  onInterpretation,
  onAgentMeta,
  onShowResults,
  initialMessage,
  variant = "full",
  className,
  showHeader = true,
  starterPrompts = DEFAULT_STARTERS,
  modelLabel,
}: Props) {
  const router = useRouter();
  const listId = useId();
  const inputId = useId();
  const locationInputId = useId();
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef(session);
  const sessionIdRef = useRef("");
  const initialSentRef = useRef(false);
  const [input, setInput] = useState("");
  const [agentMeta, setAgentMeta] = useState<FinderAgentData | null>(null);
  const [applied, setApplied] = useState<FinderInterpretationData["applied"] | null>(
    null,
  );
  const [locationDraft, setLocationDraft] = useState("");

  const compact = variant === "compact";

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    sessionIdRef.current = getOrCreateGuidedSearchSessionId();
  }, []);

  const updateSession = useCallback(
    (next: GuidedSearchSessionFields) => {
      sessionRef.current = next;
      onSessionChange?.(next);
    },
    [onSessionChange],
  );

  const handleData = useCallback(
    (dataPart: { type: string; data?: unknown }) => {
      if (
        dataPart.type === "data-finderInterpretation" &&
        dataPart.data &&
        typeof dataPart.data === "object"
      ) {
        const data = dataPart.data as FinderInterpretationData;
        setApplied(data.applied);
        onInterpretation(data);
      }
      if (
        dataPart.type === "data-finderAgent" &&
        dataPart.data &&
        typeof dataPart.data === "object"
      ) {
        const data = dataPart.data as FinderAgentData;
        setAgentMeta(data);
        onAgentMeta?.(data);
      }
    },
    [onInterpretation, onAgentMeta],
  );

  const { messages, sendMessage, status, error } =
    useChat<ProviderFinderChatUIMessage>({
      transport: new DefaultChatTransport({
        api: "/api/provider-finder/chat",
        prepareSendMessagesRequest: ({ messages: chatMessages }) => ({
          body: {
            messages: chatMessages,
            sessionId: sessionIdRef.current,
            session: sessionRef.current,
          },
        }),
      }),
      onData: handleData,
    });

  const isBusy = status === "streaming" || status === "submitted";
  const needsClarification = agentMeta?.status === "needs_clarification";
  const showLocationPicker = needsClarification && agentMeta?.clarificationSlot === "location";
  const showChoiceChips =
    needsClarification &&
    agentMeta?.clarificationSlot !== "location" &&
    (agentMeta?.suggestedChoices?.length ?? 0) > 0;

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const submitText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isBusy) return;
      setInput("");
      await sendMessage({ text: trimmed });
      requestAnimationFrame(scrollToBottom);
    },
    [isBusy, sendMessage],
  );

  useEffect(() => {
    if (!initialMessage?.trim() || initialSentRef.current) return;
    initialSentRef.current = true;
    void submitText(initialMessage);
  }, [initialMessage, submitText]);

  function handleChoiceSelect(choice: { label: string; value: string }) {
    const nextSession = applyChoiceToSession(
      sessionRef.current,
      agentMeta?.clarificationSlot,
      choice.value,
    );
    updateSession(nextSession);
    void submitText(choice.value);
  }

  function handleLocationSubmit() {
    const trimmed = locationDraft.trim();
    if (!trimmed) return;
    const nextSession = applyChoiceToSession(
      sessionRef.current,
      "location",
      trimmed,
    );
    updateSession(nextSession);
    setLocationDraft("");
    void submitText(trimmed);
  }

  function navigateToResults() {
    if (applied) {
      const params = buildFinderSearchParams(applied);
      const qs = params.toString();
      router.push(qs ? `/provider-finder?${qs}` : "/provider-finder");
    }
    onShowResults?.();
  }

  const providerResults = (agentMeta?.providerResults ??
    []) as CopilotProviderResult[];

  return (
    <Card
      variant="outlined"
      className={cn(
        "flex flex-col overflow-hidden",
        compact && "border-0 bg-transparent shadow-none",
        className,
      )}
    >
      {showHeader ? (
        <div
          className={cn(
            "border-b border-border/60",
            compact ? "px-3 py-2" : "px-4 py-3",
          )}
        >
          <h2
            className={cn(
              "font-heading font-semibold",
              compact ? "text-sm" : "text-base",
            )}
          >
            Chat to find providers
          </h2>
          <p
            className={cn(
              "text-muted-foreground",
              compact ? "text-[10px]" : "text-xs",
            )}
          >
            Describe what you need — I will set your search filters as we go.
          </p>
          {agentMeta?.filledSlots ? (
            <div className="mt-2">
              <GuidedSearchSlotProgress
                filledSlots={agentMeta.filledSlots}
                compact={compact}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <GuidedSearchMessageList
        listId={listId}
        messages={messages}
        isBusy={isBusy}
        error={error}
        compact={compact}
        bottomRef={bottomRef}
        emptyState={
          <div className="space-y-3">
            <p
              className={cn(
                "text-muted-foreground",
                compact ? "text-xs" : "text-sm",
              )}
            >
              Try an example or type your own question:
            </p>
            <div className="flex flex-wrap gap-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className={cn(
                    "rounded-full border border-border/80 bg-muted/40 text-left transition-colors hover:bg-muted",
                    compact ? "px-3 py-1.5 text-xs" : "px-3 py-2 text-sm",
                  )}
                  onClick={() => void submitText(prompt)}
                  disabled={isBusy}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {showChoiceChips && agentMeta?.suggestedChoices ? (
        <div className={cn(compact ? "px-3 pb-2" : "px-4 pb-2")}>
          <GuidedSearchChoiceChips
            choices={agentMeta.suggestedChoices}
            onSelect={handleChoiceSelect}
            disabled={isBusy}
            compact={compact}
          />
        </div>
      ) : null}

      {showLocationPicker ? (
        <div className={cn(compact ? "space-y-2 px-3 pb-2" : "space-y-2 px-4 pb-2")}>
          <AccessibleAutocomplete
            id={locationInputId}
            label="Suburb or postcode"
            placeholder="e.g. Parramatta NSW"
            context="provider_finder"
            field="location"
            value={locationDraft}
            onChange={setLocationDraft}
            debounceMs={0}
            inputClassName={compact ? "text-xs" : undefined}
          />
          <Button
            type="button"
            variant="default"
            size={compact ? "sm" : "default"}
            disabled={isBusy || !locationDraft.trim()}
            onClick={handleLocationSubmit}
          >
            Use this location
          </Button>
        </div>
      ) : null}

      {!needsClarification && agentMeta?.status === "complete" ? (
        <div className={cn(compact ? "px-3 pb-2" : "px-4 pb-2")}>
          {providerResults.length > 0 ? (
            <AskProviderResultSnippets results={providerResults} />
          ) : null}
          <Button
            type="button"
            variant="default"
            size={compact ? "sm" : "default"}
            className="mt-2 w-full sm:w-auto"
            disabled={isBusy}
            onClick={navigateToResults}
          >
            Show matching providers
          </Button>
        </div>
      ) : null}

      <div
        className={cn(
          "border-t border-border/60",
          compact ? "p-2" : "p-3",
        )}
      >
        <GuidedSearchComposer
          inputId={inputId}
          value={input}
          onChange={setInput}
          onSubmit={() => void submitText(input)}
          disabled={false}
          isBusy={isBusy}
          compact={compact}
          placeholder={
            needsClarification
              ? "Add more detail or pick a suggestion above"
              : "e.g. Auslan support worker in Newcastle"
          }
        />
        {modelLabel === "gpt-oss-120b" ? (
          <p
            className={cn(
              "mt-2 text-muted-foreground",
              compact ? "text-[10px]" : "text-xs",
            )}
            role="note"
          >
            Responses powered by gpt-oss-120b
          </p>
        ) : null}
      </div>
    </Card>
  );
}
