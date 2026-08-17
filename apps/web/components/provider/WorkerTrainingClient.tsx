"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type Module = {
  id: string;
  title: string;
  description: string | null;
  content: string;
  quizQuestions: Array<{
    question: string;
    options: string[];
    correctIndex: number;
  }>;
  passingScore: number;
};

type ComplianceRow = {
  userId: string;
  name: string;
  compliant: boolean;
  missingModuleIds: string[];
};

export function WorkerTrainingClient({
  modules,
  compliance,
}: {
  modules: Module[];
  compliance: ComplianceRow[];
}) {
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitQuiz() {
    if (!activeModule) return;
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/provider/engagement/training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId: activeModule.id, answers }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setResult(typeof data.error === "string" ? data.error : "Did not pass");
    } else {
      setResult(`Completed — score ${data.completion?.score ?? "—"}%`);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-semibold">Training modules</h2>
        <ul className="mt-3 space-y-2">
          {modules.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className="w-full rounded-lg border border-border p-3 text-left hover:bg-muted"
                onClick={() => {
                  setActiveModule(m);
                  setAnswers(m.quizQuestions.map(() => -1));
                  setResult(null);
                }}
              >
                <span className="font-medium">{m.title}</span>
                {m.description ? (
                  <p className="text-sm text-muted-foreground">{m.description}</p>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {activeModule ? (
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-semibold">{activeModule.title}</h3>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
            {activeModule.content}
          </div>
          {activeModule.quizQuestions.map((q, qi) => (
            <fieldset key={qi} className="space-y-2">
              <legend className="text-sm font-medium">{q.question}</legend>
              {q.options.map((opt, oi) => (
                <label key={oi} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`q-${qi}`}
                    checked={answers[qi] === oi}
                    onChange={() => {
                      const next = [...answers];
                      next[qi] = oi;
                      setAnswers(next);
                    }}
                  />
                  {opt}
                </label>
              ))}
            </fieldset>
          ))}
          {result ? <p className="text-sm">{result}</p> : null}
          <Button type="button" variant="default" size="default" disabled={loading} onClick={() => void submitQuiz()}>
            {loading ? "Submitting…" : "Submit quiz"}
          </Button>
        </section>
      ) : null}

      {compliance.length > 0 ? (
        <section>
          <h2 className="font-semibold">Worker compliance</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {compliance.map((w) => (
              <li
                key={w.userId}
                className={`rounded-lg border p-3 ${w.compliant ? "border-green-500/30" : "border-amber-500/40"}`}
              >
                {w.name} — {w.compliant ? "Compliant" : "Training overdue"}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
