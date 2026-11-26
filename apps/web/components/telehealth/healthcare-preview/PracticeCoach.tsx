"use client";

import { MessageSquareText } from "lucide-react";
import { useRef, useState } from "react";

import {
  isPracticeScenario,
  practiceCoachProviders,
  practiceScenarios,
  type PracticeCoachProvider,
  type PracticeScenario,
} from "@/packages/contracts/src/healthcare-practice-coach";

import styles from "./healthcare.module.css";

type Reply = {
  text: string;
  source: PracticeCoachProvider | "sample";
  unavailableProvider?: PracticeCoachProvider;
};

export function PracticeCoach({
  providers,
}: {
  providers: readonly PracticeCoachProvider[];
}) {
  const [scenario, setScenario] = useState<PracticeScenario>("moreTime");
  const [reply, setReply] = useState<Reply>();
  const [pending, setPending] = useState<PracticeCoachProvider>();
  const activeRequest = useRef(false);
  const firstReply = practiceScenarios[scenario].replies[0].text;
  const recipients = providers.map((id) => {
    const { label, recipient } = practiceCoachProviders[id];
    return `${recipient} for ${label}`;
  });

  async function askProvider(provider: PracticeCoachProvider) {
    if (activeRequest.current) return;
    activeRequest.current = true;
    setPending(provider);
    setReply(undefined);
    try {
      const response = await fetch("/telehealth/preview/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, provider }),
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Practice coach unavailable");
      const result: { source?: string; text?: string } = await response.json();
      const approved = practiceScenarios[scenario].replies.find(
        ({ text }) => text === result.text,
      );
      if (result.source !== provider || !approved)
        throw new Error("No approved selection");
      setReply({ text: approved.text, source: provider });
    } catch {
      setReply({
        text: firstReply,
        source: "sample",
        unavailableProvider: provider,
      });
    } finally {
      activeRequest.current = false;
      setPending(undefined);
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
        disabled={Boolean(pending)}
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
      {recipients.length > 0 && (
        <p id="healthcare-coach-provider-disclosure">
          Asking an online model sends this sample phrase and its prepared
          replies to {recipients.join(" or ")}.
        </p>
      )}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          disabled={Boolean(pending)}
          onClick={() => setReply({ text: firstReply, source: "sample" })}
        >
          Show a sample reply
        </button>
        {providers.map((provider) => (
          <button
            key={provider}
            type="button"
            className={`${styles.button} ${styles.secondary}`}
            aria-disabled={Boolean(pending)}
            aria-describedby="healthcare-coach-provider-disclosure"
            onClick={() => void askProvider(provider)}
          >
            Ask {practiceCoachProviders[provider].label}
          </button>
        ))}
      </div>
      <div role="status" className={styles.coachStatus}>
        {pending && (
          <p>
            Getting a sample reply from {practiceCoachProviders[pending].label}…
          </p>
        )}
        {reply && (
          <div className={styles.summary}>
            <strong>
              {reply.source === "sample"
                ? "Sample reply"
                : `Sample reply selected by ${practiceCoachProviders[reply.source].label}`}
            </strong>
            <p>{reply.text}</p>
            {reply.unavailableProvider && (
              <p>
                {practiceCoachProviders[reply.unavailableProvider].label} was
                unavailable. This reply came from MapAble’s practice library.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
