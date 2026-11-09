"use client";

import { useState } from "react";

import {
  describeLocalPreviewChoice,
  type LocalPreviewChoice,
} from "@/lib/my-support/support-status";

const CHOICES: { value: LocalPreviewChoice; label: string }[] = [
  { value: "review_replacement", label: "Review the proposed worker first" },
  { value: "decline_replacement", label: "Decline this proposed replacement" },
  { value: "request_human", label: "Ask a human coordinator for help" },
];

export function DecisionWorkbenchPreview() {
  const [choice, setChoice] = useState<LocalPreviewChoice>("review_replacement");

  return (
    <section aria-labelledby="my-support-decision-heading" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="my-support-decision-heading" className="font-heading text-xl font-bold text-[#0C1833]">
          Practise a support decision
        </h2>
        <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700">
          Fictional example
        </span>
      </div>
      <p className="mt-3 text-base leading-7 text-slate-800">
        Imagine a morning worker has cancelled and a replacement is proposed.
        You can review, decline or ask for help without automatically approving anyone.
      </p>
      <fieldset className="mt-5 space-y-3">
        <legend className="mb-3 text-base font-semibold text-[#0C1833]">
          What would you prefer?
        </legend>
        {CHOICES.map((option) => (
          <label
            key={option.value}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white p-4 text-base font-medium text-[#0C1833] has-[:checked]:border-[#005B7F] has-[:checked]:bg-[#F2F8FA]"
          >
            <input
              type="radio"
              name="my-support-example-choice"
              value={option.value}
              checked={choice === option.value}
              onChange={() => setChoice(option.value)}
              className="h-5 w-5 accent-[#005B7F]"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
      <div className="mt-5 rounded-xl border-l-4 border-[#D76B2E] bg-[#FFF8F2] p-4" aria-live="polite">
        <h3 className="font-semibold text-[#0C1833]">Decision receipt preview</h3>
        <p className="mt-2 text-base text-slate-900">{describeLocalPreviewChoice(choice)}</p>
        <p className="mt-2 text-sm text-slate-700">
          Only this browser view has changed. No booking, consent, worker or provider record
          was modified, saved or sent.
        </p>
      </div>
    </section>
  );
}
