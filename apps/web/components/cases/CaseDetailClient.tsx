"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Insight = {
  id: string;
  kind: string;
  summary: string;
  confidence: number;
  requiresReview: boolean;
  createdAt: string;
  acknowledgedAt: string | null;
  engine: string;
  detailJson: unknown;
};

type Task = {
  id: string;
  title: string;
  details: string | null;
  status: string;
  priority: string;
  dueAt: string | null;
  completedAt: string | null;
  aiSuggested: boolean;
};

type Note = {
  id: string;
  body: string;
  createdAt: string;
  pinned: boolean;
};

export interface CaseDetailClientProps {
  caseId: string;
  notes: Note[];
  tasks: Task[];
  insights: Insight[];
  canManage: boolean;
  canRunAI: boolean;
  aiEnabled: boolean;
}

export function CaseDetailClient(props: CaseDetailClientProps) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function callJson(path: string, body: unknown, method = "POST") {
    setError(null);
    setBusy(path);
    try {
      const res = await fetch(path, {
        method,
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          typeof data.error === "string"
            ? data.error
            : `Request failed with status ${res.status}`,
        );
        return null;
      }
      return (await res.json()) as unknown;
    } finally {
      setBusy(null);
    }
  }

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function onAddNote(form: FormData) {
    const body = String(form.get("body") ?? "").trim();
    if (body.length === 0) return;
    const res = await callJson(`/api/cases/${props.caseId}/notes`, { body });
    if (res) refresh();
  }

  async function onAddTask(form: FormData) {
    const title = String(form.get("title") ?? "").trim();
    if (title.length < 2) return;
    const priority = String(form.get("priority") ?? "medium");
    const res = await callJson(`/api/cases/${props.caseId}/tasks`, {
      title,
      priority,
    });
    if (res) refresh();
  }

  async function runAI(kind: "summary" | "risk_assessment" | "next_action") {
    const res = await callJson(`/api/cases/${props.caseId}/ai`, { kind });
    if (res) refresh();
  }

  async function acknowledgeInsight(insightId: string) {
    const res = await callJson(
      `/api/cases/${props.caseId}/ai/${insightId}`,
      null,
    );
    if (res) refresh();
  }

  async function setTaskStatus(taskId: string, status: string) {
    const res = await callJson(
      `/api/cases/${props.caseId}/tasks/${taskId}`,
      { status },
      "PATCH",
    );
    if (res) refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <section className="space-y-6 lg:col-span-2">
        <Panel title="Notes">
          {props.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <ul className="space-y-3">
              {props.notes.map((n) => (
                <li
                  key={n.id}
                  className={`rounded-md border border-border p-3 ${n.pinned ? "bg-amber-50/40" : ""}`}
                >
                  <p className="whitespace-pre-wrap text-sm">{n.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {format(new Date(n.createdAt), "d MMM yyyy, HH:mm")}
                    {n.pinned ? " · pinned" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {props.canManage ? (
            <form
              action={onAddNote}
              className="mt-3 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                onAddNote(new FormData(e.currentTarget));
                e.currentTarget.reset();
              }}
            >
              <textarea
                name="body"
                rows={3}
                placeholder="Add a note…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="submit"
                disabled={busy?.includes("notes")}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                Add note
              </button>
            </form>
          ) : null}
        </Panel>

        <Panel title="Tasks">
          {props.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          ) : (
            <ul className="space-y-2">
              {props.tasks.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {t.title}
                      {t.aiSuggested ? (
                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-900">
                          AI-suggested
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.priority} priority · status: {t.status}
                      {t.dueAt
                        ? ` · due ${format(new Date(t.dueAt), "d MMM")}`
                        : ""}
                    </p>
                  </div>
                  {props.canManage ? (
                    <select
                      defaultValue={t.status}
                      onChange={(e) => setTaskStatus(t.id, e.target.value)}
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                    >
                      {[
                        "pending",
                        "in_progress",
                        "blocked",
                        "done",
                        "cancelled",
                      ].map((s) => (
                        <option key={s} value={s}>
                          {s.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {props.canManage ? (
            <form
              className="mt-3 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                onAddTask(new FormData(e.currentTarget));
                e.currentTarget.reset();
              }}
            >
              <input
                name="title"
                placeholder="Task title"
                minLength={2}
                maxLength={200}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <div className="flex items-center gap-2">
                <select
                  name="priority"
                  defaultValue="medium"
                  className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                >
                  {["low", "medium", "high", "urgent"].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={busy?.includes("tasks")}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  Add task
                </button>
              </div>
            </form>
          ) : null}
        </Panel>
      </section>

      <aside className="space-y-6">
        <Panel
          title={
            <span className="flex items-center gap-2">
              AI insights
              <span
                className="rounded-full border border-dashed border-amber-400 px-2 py-0.5 text-[10px] font-medium uppercase text-amber-700"
                title="AI insights are advisory only"
              >
                advisory
              </span>
            </span>
          }
        >
          {!props.aiEnabled ? (
            <p className="text-sm text-muted-foreground">
              AI features are disabled in this environment.
            </p>
          ) : null}
          {props.aiEnabled && props.canRunAI ? (
            <div className="flex flex-wrap gap-2">
              <AIButton
                disabled={busy === `/api/cases/${props.caseId}/ai`}
                onClick={() => runAI("summary")}
                label="Generate summary"
              />
              <AIButton
                disabled={busy === `/api/cases/${props.caseId}/ai`}
                onClick={() => runAI("risk_assessment")}
                label="Classify risk"
              />
              <AIButton
                disabled={busy === `/api/cases/${props.caseId}/ai`}
                onClick={() => runAI("next_action")}
                label="Suggest next actions"
              />
            </div>
          ) : null}

          {props.insights.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No AI insights yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {props.insights.map((i) => (
                <li key={i.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {i.kind.replaceAll("_", " ")}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${i.requiresReview ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-900"}`}
                    >
                      {i.requiresReview ? "needs review" : "acknowledged"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{i.summary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    engine: {i.engine} · confidence{" "}
                    {(i.confidence * 100).toFixed(0)}% ·{" "}
                    {format(new Date(i.createdAt), "d MMM HH:mm")}
                  </p>
                  {i.requiresReview && props.canManage ? (
                    <button
                      type="button"
                      onClick={() => acknowledgeInsight(i.id)}
                      disabled={busy?.includes(i.id)}
                      className="mt-2 rounded-md border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-60"
                    >
                      Acknowledge
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {pending ? (
          <p className="text-xs text-muted-foreground">Refreshing…</p>
        ) : null}
      </aside>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function AIButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-60"
    >
      {label}
    </button>
  );
}
