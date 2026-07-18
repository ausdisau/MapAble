"use client";

import { useId, useState } from "react";

type ExplainResponse = {
  directResponse: string;
  confirmed: string[];
  unknown: string[];
  disputed: string[];
  suggestedNextQuestions: string[];
  actionTaken: false;
  easyRead?: string;
  checklist?: string[];
  providerQuestions?: string[];
  notice?: string;
};

const QUESTIONS: { value: string; label: string }[] = [
  { value: "what_happens_next", label: "What is happening next?" },
  { value: "what_changed", label: "What changed?" },
  { value: "what_remains_unknown", label: "What remains unknown?" },
  { value: "is_worker_ready", label: "Is the worker ready?" },
  { value: "is_vehicle_confirmed", label: "Is the vehicle confirmed?" },
  {
    value: "passport_acknowledged",
    label: "Has my Communication Passport been acknowledged?",
  },
  { value: "what_is_blocked", label: "Which parts are blocked?" },
  { value: "what_needs_my_decision", label: "What needs my decision?" },
  { value: "who_is_responsible", label: "Who is responsible?" },
  { value: "what_evidence_supports_this", label: "What evidence supports this?" },
  {
    value: "what_if_dependency_fails",
    label: "What happens if one dependency fails?",
  },
  { value: "easy_read", label: "Explain this in Easy Read" },
  {
    value: "prepare_provider_questions",
    label: "Prepare questions for the provider",
  },
];

export function MissionCopilotPanel() {
  const formId = useId();
  const statusId = useId();
  const [question, setQuestion] = useState(QUESTIONS[0]!.value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExplainResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mission-copilot/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Request failed");
      }
      setResult(data.data ?? data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8" aria-labelledby={`${formId}-heading`}>
      <h2 id={`${formId}-heading`} className="text-xl font-semibold">
        Ask about your journey
      </h2>
      <p className="mt-1">
        Non-chat form. Choose a question. Answers cite the mission projection and
        never take action.
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor={`${formId}-question`} className="block font-medium">
            Question
          </label>
          <select
            id={`${formId}-question`}
            className="mt-1 min-h-11 w-full border px-3 py-2"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          >
            {QUESTIONS.map((q) => (
              <option key={q.value} value={q.value}>
                {q.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="min-h-11 min-w-11 border px-4 py-2 font-medium"
            disabled={loading}
          >
            {loading ? "Loading…" : "Explain"}
          </button>
          <button
            type="button"
            className="min-h-11 min-w-11 border px-4 py-2"
            onClick={() => {
              setResult(null);
              setError(null);
            }}
          >
            Clear
          </button>
        </div>
      </form>

      <div
        id={statusId}
        role="status"
        aria-live="polite"
        className="mt-6 space-y-3"
      >
        {error ? <p className="text-red-700">Error: {error}</p> : null}
        {result ? (
          <>
            <p className="font-medium">{result.directResponse}</p>
            {result.easyRead ? (
              <p>
                <span className="font-medium">Easy Read: </span>
                {result.easyRead}
              </p>
            ) : null}
            <p>
              <span className="font-medium">Confirmed: </span>
              {result.confirmed.join("; ") || "none listed"}
            </p>
            <p>
              <span className="font-medium">Unknown: </span>
              {result.unknown.join("; ") || "none listed"}
            </p>
            <p>
              <span className="font-medium">Disputed: </span>
              {result.disputed.join("; ") || "none listed"}
            </p>
            {result.checklist?.length ? (
              <ul className="list-disc pl-5">
                {result.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {result.providerQuestions?.length ? (
              <ul className="list-disc pl-5">
                {result.providerQuestions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            <p className="text-sm">
              {result.notice ?? "No action was taken."} actionTaken=
              {String(result.actionTaken)}
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}
