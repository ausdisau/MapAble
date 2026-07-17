"use client";

import React, { useId, useRef } from "react";

import { GuidedSearchDialogue } from "@/components/guided-search/GuidedSearchDialogue";
import { useGuidedSearchLauncher } from "@/components/marketing/home/use-guided-search-launcher";
import { SearchIcon } from "@/components/marketing/mapable-care-icons";
import {
  guidedSearchPanelCopy,
  guidedSearchPromptChips,
  pathwayPreviewSteps,
} from "@/lib/marketing/mapable-care-combined-data";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function GuidedSearchPanel() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const {
    chatMode,
    chatInitialMessage,
    dialogueSession,
    setDialogueSession,
    statusHint,
    setStatusHint,
    launchChat,
    resetChat,
  } = useGuidedSearchLauncher();

  function handleLaunch(nextQuery: string, promptLabel?: string) {
    const launched = launchChat(nextQuery, promptLabel);
    if (!launched) {
      inputRef.current?.focus();
    }
  }

  return (
    <section
      id="guided-search-panel"
      aria-labelledby="guided-search-heading"
      className="border-y border-slate-200 bg-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
          {guidedSearchPanelCopy.eyebrow}
        </p>
        <h2
          id="guided-search-heading"
          className="mt-3 text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#0C1833] md:text-5xl"
        >
          {guidedSearchPanelCopy.heading}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
          {guidedSearchPanelCopy.intro}
        </p>

        <form
          className="mt-8 max-w-3xl"
          onSubmit={(event) => {
            event.preventDefault();
            handleLaunch(query);
          }}
        >
          <label htmlFor={inputId} className="text-sm font-black text-[#0C1833]">
            {guidedSearchPanelCopy.inputLabel}
          </label>
          <div className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-[#005B7F] focus-within:ring-4 focus-within:ring-[#F8C51C]/30">
            <span className="text-[#005B7F]">
              <SearchIcon />
            </span>
            <input
              ref={inputRef}
              id={inputId}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (statusHint) setStatusHint("");
              }}
              placeholder={guidedSearchPanelCopy.placeholder}
              className="h-11 min-w-0 flex-1 bg-transparent text-sm font-bold text-[#0C1833] outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              className={`min-h-11 rounded-xl bg-[#005B7F] px-4 py-2 text-sm font-black text-white transition hover:bg-[#004766] ${mapableCareFocusRing}`}
            >
              {guidedSearchPanelCopy.submitLabel}
            </button>
          </div>
          {statusHint ? (
            <p role="status" className="mt-2 text-sm font-semibold text-[#005B7F]">
              {statusHint}
            </p>
          ) : null}
        </form>

        <div
          role="group"
          aria-label="Suggested guided search prompts"
          className="mt-4 flex flex-wrap gap-2"
        >
          {guidedSearchPromptChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                setQuery(chip.prefill);
                handleLaunch(chip.prefill, chip.label);
              }}
              className={`min-h-11 rounded-full border border-slate-200 bg-[#F6FBFC] px-4 py-3 text-sm font-black text-[#005B7F] transition hover:bg-[#F8C51C]/20 ${mapableCareFocusRing}`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
              Example pathway
            </h3>
            <ol
              aria-label="Example pathway steps"
              className="mt-4 grid gap-3"
            >
              {pathwayPreviewSteps.map((step, index) => (
                <li
                  key={step}
                  className="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-[#F6FBFC] px-4 py-3 text-sm font-bold text-[#0C1833]"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#005B7F] text-xs font-black text-white"
                  >
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => handleLaunch(query)}
              className={`mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#005B7F] px-6 py-4 text-base font-black text-white shadow-sm transition hover:bg-[#004766] ${mapableCareFocusRing}`}
            >
              {guidedSearchPanelCopy.ctaLabel}
            </button>
          </div>

          {chatMode ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-[#F6FBFC] p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#005B7F]">
                  Guided search
                </p>
                <button
                  type="button"
                  onClick={resetChat}
                  className={`rounded-lg px-2 py-1 text-xs font-bold text-slate-500 transition hover:bg-slate-100 ${mapableCareFocusRing}`}
                >
                  Close
                </button>
              </div>
              <GuidedSearchDialogue
                key={chatInitialMessage || "guided-search-panel"}
                variant="compact"
                showHeader={false}
                session={dialogueSession}
                onSessionChange={setDialogueSession}
                initialMessage={chatInitialMessage}
                onInterpretation={() => {}}
                starterPrompts={guidedSearchPromptChips.map((chip) => chip.prefill).slice(0, 3)}
              />
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-[#F6FBFC] p-6 text-sm leading-7 text-slate-600">
              {guidedSearchPanelCopy.previewHint}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
