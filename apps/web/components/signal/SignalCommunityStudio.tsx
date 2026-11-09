"use client";

import { ClipboardCheck, MessageSquareText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { SignalForumPanel } from "@/components/signal/SignalForumPanel";
import { SignalSurveyPanel } from "@/components/signal/SignalSurveyPanel";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  DEMO_FORUM_TOPICS,
  changeLocalTopicModeration,
  makeAuditEvent,
  makeLocalReply,
  makeLocalTopic,
} from "@/lib/signal/community/engine";
import type {
  DemoAuditAction,
  DemoAuditEvent,
  LocalReply,
  LocalTopic,
  SurveyReview,
} from "@/lib/signal/community/types";

type View = "discussions" | "survey" | "review";
const focus = mapableCareFocusRing;
const views: Array<{ id: View; label: string }> = [
  { id: "discussions", label: "Discussions" },
  { id: "survey", label: "Accessibility survey" },
  { id: "review", label: "Review & audit" },
];

function makeId(prefix: string): string {
  return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

export function SignalCommunityStudio() {
  const [view, setView] = useState<View>("discussions");
  const [topics, setTopics] = useState<LocalTopic[]>([...DEMO_FORUM_TOPICS]);
  const [replies, setReplies] = useState<LocalReply[]>([]);
  const [surveyReview, setSurveyReview] = useState<SurveyReview | null>(null);
  const [events, setEvents] = useState<DemoAuditEvent[]>([]);
  const [message, setMessage] = useState("All actions stay in this browser tab. No records are published.");

  function audit(action: DemoAuditAction, subjectId: string) {
    setEvents((previous) => [
      makeAuditEvent(makeId("event"), action, subjectId, new Date().toISOString()),
      ...previous,
    ]);
  }

  function addTopic(title: string, body: string) {
    const item = makeLocalTopic({
      id: makeId("topic"), roomSlug: "access-and-places",
      title, body, createdAt: new Date().toISOString(),
    });
    setTopics((previous) => [item, ...previous]);
    audit("topic_drafted", item.id);
    setMessage("Local discussion draft created. It has not been sent or published.");
  }

  function addReply(topicId: string, body: string) {
    if (!topics.some((topic) => topic.id === topicId)) {
      throw new Error("Choose an existing local discussion.");
    }
    const item = makeLocalReply(makeId("reply"), topicId, body);
    setReplies((previous) => [...previous, item]);
    audit("reply_drafted", item.id);
    setMessage("Reply added to the local practice review list.");
  }

  function reviewTopic(id: string, approved: boolean) {
    setTopics((previous) => previous.map((topic) => topic.id === id
      ? changeLocalTopicModeration(
          topic, approved ? "visible_in_this_tab" : "rejected_in_this_tab",
        )
      : topic));
    audit(approved ? "topic_preview_approved" : "topic_preview_rejected", id);
    setMessage("Demo moderation applied only in this tab. Nothing was published.");
  }

  function reviewReply(id: string, approved: boolean) {
    setReplies((previous) => previous.map((reply) => reply.id === id
      ? { ...reply, moderation: approved ? "visible_in_this_tab" : "rejected_in_this_tab", synthetic: true, public: false }
      : reply));
    audit(approved ? "topic_preview_approved" : "topic_preview_rejected", id);
    setMessage("Demo reply review applied locally only.");
  }

  const pendingTopics = topics.filter((topic) => topic.moderation === "pending_local_review");
  const pendingReplies = replies.filter((reply) => reply.moderation === "pending_local_review");

  return (
    <div className="bg-white text-[#0C1833]">
      <header className="border-b border-slate-200 bg-[#F6FBFC]">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
          <p className="text-sm font-black uppercase tracking-[0.12em] text-[#005B7F]">
            MapAble Signal / Community platform
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Discuss access. Ask better questions. Review evidence.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-700">
            A TypeScript community experience joining bbPress-style discussion
            rooms with LimeSurvey-style branching questionnaires, using the real
            MapAble accessibility survey structure from FormHug.
          </p>
          <div className="mt-5 rounded-xl border-l-4 border-[#F97316] bg-orange-50 p-4 text-sm">
            <strong>Development preview only.</strong> Forum posts, survey answers,
            moderation actions and audit events stay in this browser tab. There
            is no login-based posting, backend database, upload, public
            accessibility rating or live FormHug response import.
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/mapping-days" className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 py-3 font-bold text-white ${focus}`}>
              Mapping Days
            </Link>
            <Link href="/peers/rooms/access-and-places" className={`inline-flex min-h-11 items-center rounded-xl border border-[#005B7F] px-4 py-3 font-bold text-[#005B7F] ${focus}`}>
              Existing Access & places room
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-7 px-5 py-8 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-4">
            <MessageSquareText aria-hidden="true" className="h-6 w-6 text-[#005B7F]" />
            <p className="mt-2 text-2xl font-black">{topics.length}</p>
            <p className="text-sm text-slate-600">Fictional/local discussion topics</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <ClipboardCheck aria-hidden="true" className="h-6 w-6 text-[#005B7F]" />
            <p className="mt-2 text-2xl font-black">{surveyReview ? 1 : 0}</p>
            <p className="text-sm text-slate-600">Local redacted survey reviews</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <ShieldCheck aria-hidden="true" className="h-6 w-6 text-[#005B7F]" />
            <p className="mt-2 text-2xl font-black">0</p>
            <p className="text-sm text-slate-600">Published accessibility claims</p>
          </div>
        </div>

        <div role="group" aria-label="Choose community workspace" className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
          {views.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={view === item.id}
              onClick={() => setView(item.id)}
              className={`min-h-12 rounded-xl border-2 px-4 py-3 font-bold ${focus} ${
                view === item.id
                  ? "border-[#005B7F] bg-[#005B7F] text-white"
                  : "border-slate-300 bg-white hover:border-[#005B7F]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div hidden={view !== "discussions"}>
          <SignalForumPanel
            topics={topics}
            replies={replies}
            onCreateTopic={addTopic}
            onCreateReply={addReply}
          />
        </div>
        <div hidden={view !== "survey"}>
          <SignalSurveyPanel
            onReviewed={(review) => {
              setSurveyReview(review);
              audit("survey_reviewed", "formhug-schema-local");
              setMessage("Local survey summary reviewed; no response or access claim published.");
            }}
            onWithdrawn={() => {
              setSurveyReview(null);
              audit("survey_withdrawn", "formhug-schema-local");
              setMessage("Local survey preview cleared or consent declined.");
            }}
          />
        </div>
        {view === "review" ? (
          <section aria-labelledby="signal-review-title" className="space-y-6">
            <div>
              <h2 id="signal-review-title" className="text-2xl font-black">Moderation and evidence review</h2>
              <p className="mt-2 max-w-3xl text-slate-700">
                Simulate what happens when a community discussion needs human
                moderation. Controls below are not real moderator permissions
                and never approve public publication or access verification.
              </p>
            </div>

            <section aria-labelledby="signal-pending-topics" className="rounded-2xl border border-slate-200 p-5">
              <h3 id="signal-pending-topics" className="text-xl font-bold">
                Local queue ({pendingTopics.length + pendingReplies.length})
              </h3>
              {pendingTopics.length === 0 && pendingReplies.length === 0 ? (
                <p className="mt-3 rounded-xl bg-[#F6FBFC] p-4 text-sm">
                  No practice items awaiting simulated moderation.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {pendingTopics.map((topic) => (
                    <li key={topic.id} className="rounded-xl border border-slate-300 p-4">
                      <p className="text-xs font-bold uppercase text-[#005B7F]">Topic · fictional</p>
                      <h4 className="mt-1 font-bold">{topic.title}</h4>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm">{topic.body}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => reviewTopic(topic.id, true)} className={`min-h-11 rounded-lg bg-[#005B7F] px-3 font-bold text-white ${focus}`}>Show in this tab</button>
                        <button type="button" onClick={() => reviewTopic(topic.id, false)} className={`min-h-11 rounded-lg border border-slate-400 px-3 font-bold ${focus}`}>Reject locally</button>
                      </div>
                    </li>
                  ))}
                  {pendingReplies.map((reply) => (
                    <li key={reply.id} className="rounded-xl border border-slate-300 p-4">
                      <p className="text-xs font-bold uppercase text-[#005B7F]">Reply · fictional</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm">{reply.body}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => reviewReply(reply.id, true)} className={`min-h-11 rounded-lg bg-[#005B7F] px-3 font-bold text-white ${focus}`}>Show in this tab</button>
                        <button type="button" onClick={() => reviewReply(reply.id, false)} className={`min-h-11 rounded-lg border border-slate-400 px-3 font-bold ${focus}`}>Reject locally</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="signal-survey-candidate" className="rounded-2xl border border-slate-200 p-5">
              <h3 id="signal-survey-candidate" className="text-xl font-bold">Survey candidate</h3>
              {surveyReview ? (
                <div className="mt-3 space-y-2 text-sm">
                  <p><strong>Feature:</strong> {surveyReview.featureLabel}</p>
                  <p><strong>Observation:</strong> {surveyReview.observationKind}</p>
                  <p><strong>Source:</strong> local synthetic preview, unverified community report</p>
                  <p><strong>Rating:</strong> Unknown</p>
                  <p><strong>Public release:</strong> prohibited, including when consideration was requested</p>
                  <p className="mt-2">Actual moderation, evidence provenance and correction rights belong to MapAble Access and Core. This preview cannot submit a survey response to that queue.</p>
                </div>
              ) : <p className="mt-3 text-sm">No locally reviewed survey candidate.</p>}
            </section>

            <section aria-labelledby="signal-audit" className="rounded-2xl border border-slate-200 p-5">
              <h3 id="signal-audit" className="text-xl font-bold">In-memory audit preview</h3>
              <p className="mt-2 text-sm text-slate-600">
                These are local demonstration events, not the canonical MapAble Core AuditEvent ledger.
                They contain only an event type, synthetic reference and time.
              </p>
              <ol className="mt-3 space-y-2">
                {events.map((event) => (
                  <li key={event.id} className="rounded-lg bg-[#F6FBFC] p-3 text-sm">
                    <strong>{event.action.replaceAll("_", " ")}</strong>
                    <span className="ml-2 text-slate-600">{event.at}</span>
                  </li>
                ))}
                {events.length === 0 ? <li className="text-sm text-slate-600">No local actions yet.</li> : null}
              </ol>
            </section>
          </section>
        ) : null}
        <p role="status" aria-live="polite" className="rounded-xl bg-[#EDF6F9] p-3 text-sm font-semibold">{message}</p>
      </div>
    </div>
  );
}
