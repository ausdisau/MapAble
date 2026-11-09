"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import type { LocalReply, LocalTopic } from "@/lib/signal/community/types";

const focus = mapableCareFocusRing;
const phrases = [
  "I need more information about this feature.",
  "This information may be out of date.",
  "Please allow extra time for my response.",
];

export function SignalForumPanel({
  topics,
  replies,
  onCreateTopic,
  onCreateReply,
}: {
  topics: LocalTopic[];
  replies: LocalReply[];
  onCreateTopic: (title: string, body: string) => void;
  onCreateReply: (topicId: string, body: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("demo-crossing");
  const [topicTitle, setTopicTitle] = useState("");
  const [topicBody, setTopicBody] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [error, setError] = useState("");
  const [replyError, setReplyError] = useState("");
  const filtered = useMemo(
    () => topics.filter((topic) =>
      (topic.title + " " + topic.body).toLowerCase().includes(query.toLowerCase())),
    [topics, query],
  );
  const selected = filtered.find((topic) => topic.id === selectedId) ?? filtered[0];
  const selectedReplies = replies.filter((reply) => reply.topicId === selected?.id);

  function startTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      onCreateTopic(topicTitle, topicBody);
      setTopicTitle("");
      setTopicBody("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create a local topic.");
    }
  }

  function startReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReplyError("");
    if (!selected) return;
    try {
      onCreateReply(selected.id, replyBody);
      setReplyBody("");
    } catch (cause) {
      setReplyError(cause instanceof Error ? cause.message : "Could not create a local reply.");
    }
  }

  return (
    <section aria-labelledby="signal-discussions-heading" className="space-y-6">
      <div className="space-y-2">
        <h2 id="signal-discussions-heading" className="text-2xl font-black text-[#0C1833]">
          Community discussions
        </h2>
        <p className="max-w-3xl text-slate-700">
          A bbPress-style discussion experience for the existing MapAble PEERS
          Access & places room. Topics, replies and moderation in this workspace
          remain in this browser tab only.
        </p>
        <Link href="/peers/rooms/access-and-places" className={`inline-flex min-h-11 items-center font-bold text-[#005B7F] underline ${focus}`}>
          Visit the existing Access & places room
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
        <section aria-labelledby="signal-topic-list" className="space-y-3">
          <h3 id="signal-topic-list" className="text-lg font-bold">Forum topics</h3>
          <label className="block text-sm font-semibold" htmlFor="signal-topic-search">Search topics</label>
          <input
            id="signal-topic-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search fictional discussions"
            className={`min-h-12 w-full rounded-xl border border-slate-400 p-3 ${focus}`}
          />
          <ul className="space-y-2">
            {filtered.map((topic) => (
              <li key={topic.id}>
                <button
                  type="button"
                  aria-pressed={selected?.id === topic.id}
                  onClick={() => setSelectedId(topic.id)}
                  className={`min-h-20 w-full rounded-xl border-2 p-4 text-left ${focus} ${
                    selected?.id === topic.id
                      ? "border-[#005B7F] bg-[#EDF6F9]"
                      : "border-slate-200 hover:border-[#005B7F]"
                  }`}
                >
                  <span className="block font-bold">{topic.title}</span>
                  <span className="mt-2 block text-sm text-slate-700">
                    {topic.moderation === "example"
                      ? "Fictional example"
                      : topic.moderation === "pending_local_review"
                        ? "Pending local review"
                        : topic.moderation === "visible_in_this_tab"
                          ? "Visible in this tab only"
                          : "Rejected in this tab"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {!filtered.length ? <p className="rounded-xl bg-slate-50 p-4 text-sm">No matching local topics.</p> : null}
        </section>

        <section aria-labelledby="signal-topic-detail" className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-5">
          <h3 id="signal-topic-detail" className="text-lg font-bold">
            {selected ? selected.title : "Select a discussion"}
          </h3>
          {selected ? (
            <>
              <p className="mt-3 whitespace-pre-wrap break-words text-slate-800">{selected.body}</p>
              <p className="mt-3 text-xs font-semibold text-[#005B7F]">
                Demo contributor · {selected.moderation.replaceAll("_", " ")} · never publicly posted
              </p>
              <h4 className="mt-6 font-bold">Replies in this tab</h4>
              <ul className="mt-2 space-y-2">
                {selectedReplies.map((reply) => (
                  <li key={reply.id} className="rounded-xl border bg-white p-3">
                    <p className="whitespace-pre-wrap break-words text-sm">{reply.body}</p>
                    <p className="mt-2 text-xs text-slate-600">
                      {reply.moderation === "pending_local_review" ? "Waiting for simulated review" : reply.moderation.replaceAll("_", " ")}
                    </p>
                  </li>
                ))}
                {!selectedReplies.length ? <li className="text-sm text-slate-600">No local replies yet.</li> : null}
              </ul>
              <form onSubmit={startReply} className="mt-5 space-y-3">
                <label htmlFor="signal-reply" className="block text-sm font-bold">Draft a reply</label>
                <textarea
                  id="signal-reply"
                  rows={3}
                  maxLength={1200}
                  value={replyBody}
                  onChange={(event) => setReplyBody(event.currentTarget.value)}
                  placeholder="Share a scoped question or observation. Avoid personal details."
                  className={`min-h-24 w-full rounded-xl border border-slate-400 p-3 ${focus}`}
                />
                {replyError ? <p role="alert" className="text-sm font-semibold text-red-800">{replyError}</p> : null}
                <button type="submit" className={`min-h-12 rounded-xl bg-[#005B7F] px-4 py-3 font-bold text-white ${focus}`}>
                  Add reply to local review
                </button>
              </form>
            </>
          ) : <p className="mt-3 text-sm">Choose a topic from the list.</p>}
        </section>
      </div>

      <form onSubmit={startTopic} className="space-y-4 rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div>
          <h3 className="text-xl font-bold">Start a discussion</h3>
          <p className="mt-1 text-sm text-slate-600">
            Your draft stays on this screen until refresh. It is not sent to PEERS or to a moderator.
          </p>
        </div>
        <div>
          <label htmlFor="signal-topic-title" className="block text-sm font-semibold">Topic title</label>
          <input
            id="signal-topic-title" value={topicTitle}
            onChange={(event) => setTopicTitle(event.currentTarget.value)}
            minLength={6} maxLength={120} required
            className={`mt-2 min-h-12 w-full rounded-xl border border-slate-400 p-3 ${focus}`}
            placeholder="For example: What makes a useful entrance report?"
          />
        </div>
        <div>
          <label htmlFor="signal-topic-body" className="block text-sm font-semibold">Your discussion</label>
          <textarea
            id="signal-topic-body" value={topicBody}
            onChange={(event) => setTopicBody(event.currentTarget.value)}
            minLength={10} maxLength={1200} rows={4} required
            className={`mt-2 min-h-28 w-full rounded-xl border border-slate-400 p-3 ${focus}`}
            placeholder="Describe one issue, question or information gap. No personal or identifying details."
          />
          <fieldset className="mt-3">
            <legend className="text-sm font-semibold">Optional AAC-friendly phrases</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {phrases.map((phrase) => (
                <button
                  key={phrase} type="button"
                  onClick={() => setTopicBody((current) => (current ? current + " " : "") + phrase)}
                  className={`min-h-11 rounded-xl border border-[#005B7F] px-3 py-2 text-left text-sm font-medium text-[#005B7F] ${focus}`}
                >
                  {phrase}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        {error ? <p role="alert" className="text-sm font-semibold text-red-800">{error}</p> : null}
        <button type="submit" className={`min-h-12 rounded-xl bg-[#0C1833] px-5 py-3 font-bold text-white ${focus}`}>
          Add topic to local review
        </button>
      </form>
    </section>
  );
}
