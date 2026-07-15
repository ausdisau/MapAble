import React from "react";
export function WhatToConfirmList({
  questions,
  heading = "What to confirm before going",
}: {
  questions: string[];
  heading?: string;
}) {
  if (questions.length === 0) {
    return (
      <section aria-labelledby="confirm-heading" className="rounded-2xl border border-slate-200 p-5">
        <h2 id="confirm-heading" className="text-lg font-semibold text-[#0C1833]">
          {heading}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          No urgent gaps identified from the current access profile. Still confirm critical
          needs before travelling.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="confirm-heading" className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
      <h2 id="confirm-heading" className="text-lg font-semibold text-[#0C1833]">
        {heading}
      </h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-800">
        {questions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ol>
    </section>
  );
}
