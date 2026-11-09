"use client";

import { useMemo, useState } from "react";

import { formHugAccessSurvey } from "@/lib/signal/community/formhug-schema";
import {
  PUBLIC_FORMHUG_URL,
  SENSITIVE_CAPTURE_FIELDS,
  getSanitizedAnswers,
  isQuestionVisible,
  surveyAborted,
  surveyPages,
  summariseLocalSurvey,
  validateSurveyPage,
} from "@/lib/signal/community/engine";
import type {
  FormHugQuestion, SurveyAnswer, SurveyAnswers, SurveyReview,
} from "@/lib/signal/community/types";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

const focus = mapableCareFocusRing;
const SAFE_HELP =
  "This is a local practice form. Do not enter names, diagnoses, personal addresses or identifiable incident information.";

function SurveyField({
  field,
  value,
  onChange,
}: {
  field: FormHugQuestion;
  value: SurveyAnswer | undefined;
  onChange: (value: SurveyAnswer) => void;
}) {
  const id = "signal-field-" + field.apiCode;
  if (field.type === "description") {
    return <p className="rounded-xl bg-[#EDF6F9] p-4 text-sm text-[#0C1833]">{field.label}</p>;
  }
  if (SENSITIVE_CAPTURE_FIELDS.has(field.apiCode)) {
    return (
      <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4 text-sm">
        <strong className="block">{field.label}</strong>
        <p className="mt-1">
          Location pins, contact email, media and voice files are not collected by
          this prototype. They require a separately reviewed secure workflow.
        </p>
      </div>
    );
  }
  if (field.type === "radio" || field.type === "checkbox") {
    const selected = Array.isArray(value) ? value : value ? [value] : [];
    return (
      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-1 font-bold">
          {field.label}{field.required ? " (required)" : " (optional)"}
        </legend>
        <div className="space-y-2">
          {field.choices.map((choice) => {
            const inputId = id + "-" + choice.code;
            const checked = selected.includes(choice.code);
            return (
              <label key={choice.code} htmlFor={inputId} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-[#EDF6F9]">
                <input
                  id={inputId}
                  name={field.apiCode}
                  type={field.type === "radio" ? "radio" : "checkbox"}
                  value={choice.code}
                  checked={checked}
                  onChange={(event) => {
                    if (field.type === "radio") onChange(choice.code);
                    else if (event.currentTarget.checked) onChange([...selected, choice.code]);
                    else onChange(selected.filter((code) => code !== choice.code));
                  }}
                  className="mt-1 h-5 w-5 shrink-0 accent-[#005B7F]"
                />
                <span className="text-sm text-[#0C1833]">{choice.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }
  if (field.type === "dropdown") {
    return (
      <div>
        <label htmlFor={id} className="block font-bold">{field.label}{field.required ? " (required)" : " (optional)"}</label>
        <select
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.currentTarget.value)}
          className={`mt-2 min-h-12 w-full rounded-xl border border-slate-400 p-3 ${focus}`}
        >
          <option value="">Choose an option</option>
          {field.choices.map((choice) => (
            <option key={choice.code} value={choice.code}>{choice.label}</option>
          ))}
        </select>
      </div>
    );
  }
  if (field.type === "long_text") {
    return (
      <div>
        <label htmlFor={id} className="block font-bold">{field.label}</label>
        <textarea
          id={id} value={typeof value === "string" ? value : ""}
          maxLength={2000} rows={4}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder="Describe one observed feature, without personally identifying information."
          className={`mt-2 min-h-28 w-full rounded-xl border border-slate-400 p-3 ${focus}`}
        />
        {field.help ? <p className="mt-2 text-sm text-slate-600">{field.help}</p> : null}
      </div>
    );
  }
  if (field.type === "short_text" || field.type === "number" || field.type === "date") {
    const type = field.type === "short_text" ? "text" : field.type;
    return (
      <div>
        <label htmlFor={id} className="block font-bold">{field.label}{field.required ? " (required)" : " (optional)"}</label>
        <input
          id={id} type={type} value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.currentTarget.value)}
          maxLength={field.type === "short_text" ? 200 : undefined}
          min={field.type === "number" ? "1" : undefined}
          max={field.type === "number" ? "10000" : undefined}
          step={field.type === "number" ? "1" : undefined}
          className={`mt-2 min-h-12 w-full rounded-xl border border-slate-400 p-3 ${focus}`}
        />
        {field.help ? <p className="mt-2 text-sm text-slate-600">{field.help}</p> : null}
      </div>
    );
  }
  return <p className="text-sm text-slate-600">This optional field is not captured in the local preview.</p>;
}

function exportRedactedSummary(review: SurveyReview) {
  // No personal, free-text, email, location, media or contact data.
  const file = new Blob([JSON.stringify(review, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "mapable-signal-local-survey-summary.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function SignalSurveyPanel({
  onReviewed,
  onWithdrawn,
}: {
  onReviewed: (summary: SurveyReview) => void;
  onWithdrawn: () => void;
}) {
  const pages = useMemo(() => surveyPages(), []);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [review, setReview] = useState<SurveyReview | null>(null);
  const [notice, setNotice] = useState("");
  const page = pages[pageIndex];
  const declined = surveyAborted(answers);

  function setValue(field: FormHugQuestion, value: SurveyAnswer) {
    setErrors([]);
    setReview(null);
    setNotice("");
    if (field.apiCode === "field_3" && value === "X3ej") {
      setAnswers({ field_3: value });
      setPageIndex(0);
      onWithdrawn();
      return;
    }
    setAnswers((previous) => {
      const next = { ...previous, [field.apiCode]: value };
      return getSanitizedAnswers(next);
    });
  }

  function clearPreview() {
    setAnswers({});
    setPageIndex(0);
    setErrors([]);
    setReview(null);
    setNotice("This local preview was cleared. No response was submitted.");
    onWithdrawn();
  }

  function continuePreview() {
    if (declined) {
      setErrors(["You declined internal review consent. This local form will not continue or submit."]);
      return;
    }
    const problems = validateSurveyPage(page, answers);
    setErrors(problems);
    if (problems.length) return;
    if (pageIndex < pages.length - 1) {
      setPageIndex((current) => current + 1);
      setNotice("Moved to the next survey section.");
      return;
    }
    try {
      const result = summariseLocalSurvey(answers);
      setReview(result);
      setNotice("Local practice review created. No FormHug or MapAble submission occurred.");
      onReviewed(result);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "The survey is incomplete."]);
    }
  }

  return (
    <section aria-labelledby="signal-survey-title" className="space-y-5">
      <div>
        <h2 id="signal-survey-title" className="text-2xl font-black">Community accessibility survey studio</h2>
        <p className="mt-2 text-slate-700">
          LimeSurvey-style multi-section questions and conditional logic, imported
          from the live FormHug <strong>survey definition</strong>. This page uses
          no respondent records and does not submit answers.
        </p>
        <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          {SAFE_HELP} Email, precise locations and media are deliberately disabled
          here. A real FormHug response is made only on FormHug's separate site.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#005B7F]">
              FormHug source · version {formHugAccessSurvey.version}
            </p>
            <h3 className="mt-1 text-lg font-bold">{formHugAccessSurvey.formName}</h3>
          </div>
          <span className="rounded-full bg-[#EDF6F9] px-3 py-2 text-sm font-bold">
            {formHugAccessSurvey.entriesAtInspection} submissions at inspection
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 text-sm">
          <span>Section {pageIndex + 1} of {pages.length}</span>
          <span>{page.title}</span>
        </div>
        <progress
          aria-label="Survey section progress"
          max={pages.length}
          value={pageIndex + 1}
          className="mt-2 h-3 w-full accent-[#005B7F]"
        />

        <div className="mt-6 space-y-5">
          <h4 className="text-xl font-bold">{page.title}</h4>
          {page.questions.filter((question) => isQuestionVisible(question, answers)).map((field) => (
            <SurveyField
              key={field.apiCode}
              field={field}
              value={answers[field.apiCode]}
              onChange={(value) => setValue(field, value)}
            />
          ))}
          {declined ? (
            <p role="status" className="rounded-xl border border-slate-300 bg-slate-50 p-4">
              You chose not to consent. The survey is stopped; no response will
              be recorded or published. You can change the choice or clear the form.
            </p>
          ) : null}
          {errors.length ? (
            <div role="alert" className="rounded-xl border border-red-400 bg-red-50 p-4 text-red-950">
              <p className="font-bold">Please review:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {errors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={() => { setPageIndex((i) => Math.max(0, i - 1)); setErrors([]); }}
              disabled={pageIndex === 0}
              className={`min-h-12 rounded-xl border border-slate-400 px-4 font-bold disabled:cursor-not-allowed disabled:opacity-40 ${focus}`}
            >
              Previous section
            </button>
            <button
              type="button"
              disabled={declined}
              onClick={continuePreview}
              className={`min-h-12 rounded-xl bg-[#005B7F] px-5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 ${focus}`}
            >
              {pageIndex === pages.length - 1 ? "Review local practice summary" : "Next section"}
            </button>
            <button type="button" onClick={clearPreview} className={`min-h-12 rounded-xl border border-slate-400 px-4 font-bold ${focus}`}>
              Clear or withdraw
            </button>
          </div>
          <p role="status" aria-live="polite" className="text-sm text-slate-700">{notice || "No response has been sent."}</p>
        </div>
      </div>

      {review ? (
        <section aria-labelledby="signal-survey-review" className="rounded-2xl border border-[#005B7F] bg-[#EDF6F9] p-5">
          <h3 id="signal-survey-review" className="text-xl font-bold">Your local review summary</h3>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="font-semibold">Observation type</dt><dd>{review.observationKind}</dd></div>
            <div><dt className="font-semibold">Feature</dt><dd>{review.featureLabel}</dd></div>
            <div><dt className="font-semibold">Answered questions</dt><dd>{review.answeredCount}</dd></div>
            <div><dt className="font-semibold">Public reporting permission</dt><dd>{review.publicConsiderationRequested ? "Consideration requested only" : "Not requested"}</dd></div>
            <div><dt className="font-semibold">Verification</dt><dd>Unverified community report</dd></div>
            <div><dt className="font-semibold">Access rating</dt><dd>Unknown</dd></div>
          </dl>
          <p className="mt-3 text-sm">
            This is not an inspection, approved report, complaint or verified
            accessibility claim. It contains no identifying data and remains
            in your browser tab.
          </p>
          <button type="button" onClick={() => exportRedactedSummary(review)} className={`mt-4 min-h-12 rounded-xl border border-[#005B7F] bg-white px-4 font-bold ${focus}`}>
            Export redacted practice summary (JSON)
          </button>
        </section>
      ) : null}

      <p className="text-sm text-slate-700">
        Prefer the original form, including optional media?{" "}
        <a href={PUBLIC_FORMHUG_URL} target="_blank" rel="noopener noreferrer" className={`font-bold text-[#005B7F] underline ${focus}`}>
          Open the FormHug accessibility survey
        </a>.
        This leaves MapAble and uses FormHug's real submission and privacy controls.
      </p>
    </section>
  );
}
