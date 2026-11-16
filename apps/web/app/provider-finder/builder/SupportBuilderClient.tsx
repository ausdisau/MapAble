"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ArrowUp,
  Check,
  ClipboardCopy,
  Loader2,
  MessageSquare,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Square,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { RelationalFitPanel } from "@/components/support-builder/RelationalFitPanel";
import {
  composeDraftSummary,
  detectSupportKinds,
  EMPTY_SUPPORT_DRAFT,
  SUPPORT_KINDS,
  type ProviderDiscovery,
  supportKindLabel,
  type SupportDraft,
  type SupportKind,
} from "@/lib/support-builder/core";

const STARTERS = [
  "I need help getting ready and accessible transport",
  "I want to join a community activity twice a week",
  "Help me look for support around my work schedule",
];

const FREQUENCIES: Array<{ value: SupportDraft["frequency"]; label: string }> = [
  { value: "flexible", label: "To be decided" },
  { value: "one-off", label: "One-off" },
  { value: "weekly", label: "Weekly" },
  { value: "twice-weekly", label: "Twice weekly" },
  { value: "daily", label: "Daily" },
];

export default function SupportBuilderClient({
  aiEnabled,
  relationalFitEnabled,
}: {
  aiEnabled: boolean;
  relationalFitEnabled: boolean;
}) {
  const [draft, setDraft] = useState<SupportDraft>(EMPTY_SUPPORT_DRAFT);
  const [input, setInput] = useState("");
  const [mobileView, setMobileView] = useState<"chat" | "builder">("chat");
  const [discovery, setDiscovery] = useState<ProviderDiscovery | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [notice, setNotice] = useState("");
  const chatLogId = useId();
  const inputId = useId();
  const localityId = useId();
  const queryId = useId();
  const frequencyId = useId();
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    sendMessage,
    stop,
    setMessages,
    status,
    error: chatError,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/provider-finder/builder/chat",
    }),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length, busy]);

  async function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed || busy) return;

    const proposed = detectSupportKinds(trimmed);
    if (proposed.length) {
      setDraft((prior) => ({
        ...prior,
        kinds: [...new Set([...prior.kinds, ...proposed])] as SupportKind[],
      }));
    }
    setInput("");
    setNotice(
      proposed.length
        ? "Suggested support components were added to your editable draft."
        : "You can add support components manually in the builder.",
    );

    if (aiEnabled) {
      await sendMessage({ text: trimmed });
    } else {
      setMobileView("builder");
    }
  }

  function toggleKind(kind: SupportKind) {
    setDraft((prior) => ({
      ...prior,
      kinds: prior.kinds.includes(kind)
        ? prior.kinds.filter((selected) => selected !== kind)
        : [...prior.kinds, kind],
    }));
    setDiscovery(null);
  }

  function startAgain() {
    stop();
    setMessages([]);
    setDraft(EMPTY_SUPPORT_DRAFT);
    setInput("");
    setDiscovery(null);
    setSearchError("");
    setNotice("A new, unsaved draft has started.");
    setMobileView("chat");
  }

  async function searchDirectory() {
    if (!draft.locality.trim() && !draft.query.trim()) {
      setSearchError("Enter a suburb, postcode or provider search term first.");
      return;
    }
    setSearchError("");
    setDiscovery(null);
    setSearching(true);
    const params = new URLSearchParams({
      locality: draft.locality.trim(),
      query: draft.query.trim(),
    });
    draft.kinds.forEach((kind) => params.append("kind", kind));
    try {
      const response = await fetch(
        "/api/provider-finder/builder/search?" + params.toString(),
        { method: "GET", cache: "no-store" },
      );
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error("Provider records could not be searched.");
      }
      setDiscovery(payload as ProviderDiscovery);
      setMobileView("builder");
    } catch {
      setSearchError(
        "The directory is unavailable. Your draft is still editable; try the existing Provider Finder.",
      );
    } finally {
      setSearching(false);
    }
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(composeDraftSummary(draft));
      setNotice("Your draft summary was copied. Nothing was sent to a provider.");
    } catch {
      setNotice("Copy was unavailable. You can still review the draft on screen.");
    }
  }

  return (
    <main className="min-h-[calc(100vh-6rem)] bg-background text-foreground">
      <div className="mx-auto flex max-w-[1600px] flex-col lg:min-h-[calc(100vh-6rem)] lg:flex-row">
        <aside
          className="hidden w-60 shrink-0 flex-col gap-4 border-r border-border bg-muted/30 p-4 lg:flex"
          aria-label="Support Builder navigation"
        >
          <Link href="/provider-finder" className="text-sm text-primary underline underline-offset-4">
            MapAble Provider Finder
          </Link>
          <div>
            <h1 className="font-heading text-lg font-semibold">Build my support</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Your needs. Your choices. Your draft.
            </p>
          </div>
          <button
            type="button"
            onClick={startAgain}
            className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-background px-3 text-left text-sm hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Plus size={18} aria-hidden /> New conversation
          </button>
          <div className="mt-auto rounded-lg border border-border bg-background p-3 text-xs">
            <ShieldCheck size={18} aria-hidden />
            <p className="mt-2 font-semibold">Private preview</p>
            <p className="mt-1 text-muted-foreground">
              Drafts are not saved or sent. Avoid entering identifying health details.
              AI processing may occur outside Australia; location has not been verified.
            </p>
          </div>
        </aside>

        <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
          <div>
            <span className="font-heading font-semibold">MapAble Support Builder</span>
            <p className="text-xs text-muted-foreground">Draft only · No enquiry sent</p>
          </div>
          <button
            type="button"
            aria-label="Start a new conversation"
            onClick={startAgain}
            className="rounded-lg border border-border p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <RotateCcw size={18} aria-hidden />
          </button>
        </div>

        <div className="flex gap-2 border-b border-border p-2 lg:hidden" aria-label="View options">
          <button
            type="button"
            aria-pressed={mobileView === "chat"}
            onClick={() => setMobileView("chat")}
            className={mobileView === "chat"
              ? "min-h-11 flex-1 rounded-lg bg-primary px-3 text-primary-foreground"
              : "min-h-11 flex-1 rounded-lg bg-muted px-3"}
          >
            Conversation
          </button>
          <button
            type="button"
            aria-pressed={mobileView === "builder"}
            onClick={() => setMobileView("builder")}
            className={mobileView === "builder"
              ? "min-h-11 flex-1 rounded-lg bg-primary px-3 text-primary-foreground"
              : "min-h-11 flex-1 rounded-lg bg-muted px-3"}
          >
            Package & results
          </button>
        </div>

        <section
          aria-label="Conversation"
          className={(mobileView === "chat" ? "flex " : "hidden lg:flex ") +
            "min-w-0 flex-1 flex-col"}
        >
          <header className="border-b border-border px-4 py-4 sm:px-7">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" aria-hidden />
              <h2 className="font-heading text-lg font-semibold">Support Builder assistant</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Describe what you would like to do. Review suggestions before searching.
            </p>
          </header>

          <div
            id={chatLogId}
            role="log"
            aria-label="Support Builder conversation"
            aria-live="polite"
            aria-relevant="additions"
            className="min-h-[380px] flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-8"
          >
            {messages.length === 0 && (
              <div className="mx-auto max-w-2xl space-y-5 pt-6">
                <h3 className="font-heading text-2xl font-semibold">
                  What would you like your support to make possible?
                </h3>
                <p className="text-muted-foreground">
                  Start with a goal, routine or activity. Build a package of support,
                  then explore local provider records. You can change any suggestion.
                </p>
                <div className="grid gap-2">
                  {STARTERS.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      disabled={busy}
                      onClick={() => void submit(starter)}
                      className="min-h-11 rounded-xl border border-border bg-card p-3 text-left text-sm hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message) => {
              const text = message.parts
                .filter((part) => part.type === "text")
                .map((part) => part.type === "text" ? part.text : "")
                .join("");
              if (!text) return null;
              return (
                <div
                  key={message.id}
                  className={message.role === "user"
                    ? "ml-auto max-w-[88%] rounded-2xl bg-primary p-4 text-sm text-primary-foreground"
                    : "mr-auto max-w-[94%] whitespace-pre-wrap rounded-2xl bg-muted p-4 text-sm"}
                >
                  <span className="sr-only">{message.role === "user" ? "You" : "Assistant"}: </span>
                  {text}
                </div>
              );
            })}
            {busy && (
              <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden />
                Assistant is responding…
              </p>
            )}
            {chatError && (
              <p role="alert" className="text-sm text-destructive">
                AI chat is unavailable. You can continue using the package builder.
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border p-4 sm:px-7">
            {!aiEnabled && (
              <p role="status" className="mb-2 text-sm text-muted-foreground">
                AI chat is disabled in this preview. Enter your goal to suggest editable components.
              </p>
            )}
            <form
              className="mx-auto max-w-3xl"
              onSubmit={(event) => {
                event.preventDefault();
                void submit(input);
              }}
            >
              <label htmlFor={inputId} className="sr-only">Describe your support goal</label>
              <div className="flex items-end gap-2 rounded-2xl border border-input bg-card p-2 focus-within:ring-2 focus-within:ring-ring">
                <textarea
                  id={inputId}
                  rows={2}
                  maxLength={1800}
                  className="min-h-16 flex-1 resize-y bg-transparent px-2 py-2 text-sm outline-none"
                  placeholder="What would you like help with?"
                  value={input}
                  disabled={busy}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      void submit(input);
                    }
                  }}
                />
                {busy ? (
                  <button
                    type="button"
                    aria-label="Stop response"
                    onClick={stop}
                    className="min-h-11 min-w-11 rounded-xl bg-muted p-2"
                  >
                    <Square size={18} aria-hidden />
                  </button>
                ) : (
                  <button
                    type="submit"
                    aria-label={aiEnabled ? "Send message" : "Add suggested components"}
                    disabled={!input.trim()}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"
                  >
                    <ArrowUp size={19} aria-hidden />
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Suggestions are not service decisions. Do not include information you do not want processed by the selected AI provider.
              </p>
            </form>
          </div>
        </section>

        <section
          aria-label="Editable support package and provider results"
          className={(mobileView === "builder" ? "block " : "hidden lg:block ") +
            "w-full shrink-0 border-l border-border bg-muted/20 lg:w-[370px]"}
        >
          <div className="max-h-none space-y-5 overflow-y-auto p-4 lg:max-h-[calc(100vh-6rem)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-heading text-lg font-semibold">Your support package</h2>
                <p className="text-xs text-muted-foreground">Editable, unsaved and not shared</p>
              </div>
              <button
                type="button"
                onClick={() => void copyDraft()}
                aria-label="Copy your support draft summary"
                className="rounded-lg border border-border bg-background p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <ClipboardCopy size={18} aria-hidden />
              </button>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">Choose support components</legend>
              {SUPPORT_KINDS.map((kind) => {
                const selected = draft.kinds.includes(kind.id);
                return (
                  <label
                    key={kind.id}
                    className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleKind(kind.id)}
                      className="mt-1 h-4 w-4 accent-primary"
                    />
                    <span className="flex-1">
                      <span className="block font-medium">{kind.label}</span>
                      <span className="block text-xs text-muted-foreground">{kind.hint}</span>
                    </span>
                    {selected && <Check size={17} className="text-primary" aria-hidden />}
                  </label>
                );
              })}
            </fieldset>

            <div className="space-y-2">
              <label htmlFor={frequencyId} className="text-sm font-semibold">
                How often might you need support?
              </label>
              <select
                id={frequencyId}
                value={draft.frequency}
                onChange={(event) =>
                  setDraft((prior) => ({
                    ...prior,
                    frequency: event.target.value as SupportDraft["frequency"],
                  }))
                }
                className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {FREQUENCIES.map((frequency) => (
                  <option value={frequency.value} key={frequency.value}>
                    {frequency.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor={localityId} className="text-sm font-semibold">
                Suburb, region or postcode
              </label>
              <input
                id={localityId}
                type="text"
                autoComplete="address-level2"
                value={draft.locality}
                maxLength={100}
                onChange={(event) => {
                  setDraft((prior) => ({ ...prior, locality: event.target.value }));
                  setDiscovery(null);
                }}
                placeholder="e.g. Penrith NSW"
                className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                No precise location is requested or collected.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor={queryId} className="text-sm font-semibold">
                Optional provider or service search term
              </label>
              <input
                id={queryId}
                type="search"
                value={draft.query}
                maxLength={100}
                onChange={(event) => {
                  setDraft((prior) => ({ ...prior, query: event.target.value }));
                  setDiscovery(null);
                }}
                placeholder="e.g. personal care"
                className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={() => void searchDirectory()}
              disabled={searching}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-50"
            >
              {searching ? <Loader2 size={17} className="motion-safe:animate-spin" aria-hidden /> : <Search size={17} aria-hidden />}
              Search provider records
            </button>

            {notice && <p role="status" className="text-xs text-muted-foreground">{notice}</p>}
            {searchError && <p role="alert" className="text-sm text-destructive">{searchError}</p>}

            <div className="border-t border-border pt-4" aria-live="polite">
              <h3 className="font-heading text-base font-semibold">Provider leads</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Candidate records only. No provider has agreed to deliver these supports.
              </p>
              {discovery ? (
                <div className="mt-3 space-y-3">
                  <p className="text-sm" role="status">
                    {discovery.providers.length} directory record{discovery.providers.length === 1 ? "" : "s"} returned
                  </p>
                  {discovery.providers.map((provider) => (
                    <article key={provider.id} className="space-y-2 rounded-xl border border-border bg-card p-3">
                      <h4 className="font-semibold">{provider.name}</h4>
                      <p className="text-xs text-muted-foreground">{provider.locationLabel}</p>
                      <p className="text-xs">{provider.registrationNote}</p>
                      <p className="text-xs text-muted-foreground">
                        Availability and service-area coverage: not confirmed
                      </p>
                      {draft.kinds.length > 0 && (
                        <p className="text-xs">
                          {provider.relatedKinds.length
                            ? "Related categories mentioned in record: " + provider.relatedKinds.map(supportKindLabel).join(", ")
                            : "The selected support categories are not established by this record."}
                        </p>
                      )}
                      {!!provider.serviceSignals.length && (
                        <p className="text-xs text-muted-foreground">
                          Listed signals: {provider.serviceSignals.join(", ")}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">{provider.sourceLabel}</p>
                      {provider.lastRecordedAt && (
                        <p className="text-xs text-muted-foreground">
                          Database record updated: {provider.lastRecordedAt.slice(0, 10)}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 text-sm">
                        {provider.sourceUrl && (
                          <a href={provider.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                            Data source
                          </a>
                        )}
                        {provider.website && (
                          <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                            Provider website
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                  <p className="text-xs text-muted-foreground">{discovery.coverageNote}</p>
                  <p className="text-xs text-muted-foreground">
                    Sources checked: {discovery.sourcesChecked.join("; ")}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Search to see source-labelled provider records. Your selected support
                  components are preferences, not automatically verified matches.
                </p>
              )}
            </div>
            {relationalFitEnabled && <RelationalFitPanel locality={draft.locality} />}
            <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">You stay in control</p>
              <p className="mt-1">
                No automatic contact, booking, worker assignment, NDIS claim or
                sharing of your draft. Save-and-return requires separate
                participant-authorised implementation.
              </p>
              <Link href="/provider-finder" className="mt-2 inline-block text-primary underline">
                Open the existing Provider Finder
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
