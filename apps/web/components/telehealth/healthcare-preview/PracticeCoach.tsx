"use client";

import { MessageSquareText } from "lucide-react";
import { useRef, useState } from "react";

import {
  isPracticeScenario,
  practiceScenarios,
  type PracticeScenario,
} from "@/packages/contracts/src/healthcare-practice-coach";

import styles from "./healthcare.module.css";

type Reply = { text: string; source: "muse" | "sample"; fallback?: boolean };

export function PracticeCoach({ museAvailable }: { museAvailable: boolean }) {
  const [scenario, setScenario] = useState<PracticeScenario>("moreTime");
  const [reply, setReply] = useState<Reply>();
  const [pending, setPending] = useState(false);
  const activeRequest = useRef(false);
  const firstReply = practiceScenarios[scenario].replies[0].text;

  async function askMuse() {
    if (activeRequest.current) return;
    activeRequest.current = true;
    setPending(true);
    setReply(undefined);
    try {
      const response = await fetch("/telehealth/preview/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Practice coach unavailable");
      const result: { source?: string; text?: string } = await response.json();
      const approved = practiceScenarios[scenario].replies.find(
        ({ text }) => text === result.text,
      );
      if (result.source !== "muse" || !approved)
        throw new Error("No Muse selection");
      setReply({ text: approved.text, source: "muse" });
    } catch {
      setReply({ text: firstReply, source: "sample", fallback: true });
    } finally {
      activeRequest.current = false;
      setPending(false);
    }
  }

  return (
    <section
      className={`${styles.card} ${styles.practiceCoach}`}
      aria-labelledby="healthcare-coach"
    >
      <span className={styles.iconWell}>
        <MessageSquareText size={22} aria-hidden="true" />
      </span>
      <h2 id="healthcare-coach">Practise asking for what you need</h2>
      <p>Try a phrase you could type or use with AAC during an appointment.</p>
      <label htmlFor="healthcare-coach-scenario">Practice phrase</label>
      <select
        id="healthcare-coach-scenario"
        disabled={pending}
        value={scenario}
        onChange={(event) => {
          const value = event.target.value;
          if (!isPracticeScenario(value)) return;
          setScenario(value);
          setReply(undefined);
        }}
      >
        {Object.entries(practiceScenarios).map(([value, item]) => (
          <option key={value} value={value}>
            {item.phrase}
          </option>
        ))}
      </select>
      {museAvailable && (
        <p>
          Choosing Muse Spark sends this sample phrase and the prepared replies
          to Meta.
        </p>
      )}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          disabled={pending}
          onClick={() => setReply({ text: firstReply, source: "sample" })}
        >
          Show a sample reply
        </button>
        {museAvailable && (
          <button
            type="button"
            className={`${styles.button} ${styles.secondary}`}
            disabled={pending}
            onClick={() => void askMuse()}
          >
            Ask Muse Spark
          </button>
        )}
      </div>
      <div role="status" className={styles.coachStatus}>
        {pending && <p>Getting a sample reply…</p>}
        {reply && (
          <div className={styles.summary}>
            <strong>
              {reply.source === "muse"
                ? "Sample reply selected by Muse Spark"
                : "Sample reply"}
            </strong>
            <p>{reply.text}</p>
            {reply.fallback && (
              <p>
                Muse Spark was unavailable. This reply came from MapAble’s
                practice library.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
