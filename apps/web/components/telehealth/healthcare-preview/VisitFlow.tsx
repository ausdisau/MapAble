"use client";

import {
  ArrowRight,
  Captions,
  CircleCheck,
  Clock3,
  Headphones,
  LockKeyhole,
  MessageSquareText,
  Video,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, type Dispatch, type FormEvent } from "react";

import {
  accessOptions,
  maxMessageLength,
  quickPhrases,
  visit,
  visitModes,
  type HealthcarePreview,
  type VisitAction,
  type VisitStage,
} from "@/packages/contracts/src/healthcare-preview";

import styles from "./healthcare.module.css";
import { DeviceCheck } from "./PreviewTools";

type Props = {
  state: HealthcarePreview;
  dispatch: Dispatch<VisitAction>;
  onAccess: () => void;
  onHelp: () => void;
  draft: string;
  setDraft: (draft: string) => void;
  captions: boolean;
  toggleCaptions: () => void;
};

const steps: Array<{ id: VisitStage; label: string }> = [
  { id: "prepare", label: "Prepare" },
  { id: "waiting", label: "Waiting room" },
  { id: "consultation", label: "Consultation" },
  { id: "complete", label: "Complete" },
];

const modeIcons = { video: Video, audio: Headphones, text: MessageSquareText };

function Preparation({ state, dispatch, onAccess, onHelp }: Props) {
  const shared = state.shareAccess && state.access.length > 0;
  return (
    <div className={styles.flowGrid}>
      <section className={styles.card}>
        <fieldset className={styles.fieldset}>
          <legend>How would you like to join?</legend>
          <div className={styles.modeOptions}>
            {visitModes.map((mode) => {
              const Icon = modeIcons[mode.id];
              return (
                <label key={mode.id} className={styles.modeOption}>
                  <input
                    type="radio"
                    name="healthcare-visit-mode"
                    value={mode.id}
                    checked={state.mode === mode.id}
                    onChange={() =>
                      dispatch({ type: "chooseMode", mode: mode.id })
                    }
                  />
                  <Icon size={21} aria-hidden="true" />
                  <span>
                    <strong>{mode.label}</strong>
                    <small>{mode.detail}</small>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        {state.mode === "text" ? (
          <p className={styles.summary}>
            You can type at your own pace. Quick phrases are available in the
            consultation.
          </p>
        ) : (
          <DeviceCheck key={state.mode} mode={state.mode} />
        )}
      </section>

      <section className={styles.card}>
        <span className={styles.iconWell}>
          <LockKeyhole size={22} aria-hidden="true" />
        </span>
        <h2>Review and continue</h2>
        <p>
          Your camera and microphone stay off in the practice consultation.
          Messages are cleared when you leave.
        </p>
        <div className={styles.summary}>
          <strong>Access preferences</strong>
          <p>
            {shared
              ? "These choices are visible to the simulated clinician in this practice visit."
              : "No preferences shared."}
          </p>
          {shared && (
            <ul>
              {accessOptions
                .filter((option) => state.access.includes(option.id))
                .map((option) => (
                  <li key={option.id}>{option.label}</li>
                ))}
            </ul>
          )}
        </div>
        <button type="button" className={styles.textButton} onClick={onAccess}>
          Edit access preferences <ArrowRight size={17} aria-hidden="true" />
        </button>
        <label
          htmlFor="healthcare-acknowledgement"
          className={styles.checkOption}
        >
          <input
            type="checkbox"
            id="healthcare-acknowledgement"
            checked={state.acknowledged}
            onChange={(event) =>
              dispatch({ type: "acknowledge", value: event.target.checked })
            }
          />
          <span>I understand this is a practice visit.</span>
        </label>
        <button
          type="button"
          className={styles.button}
          disabled={!state.acknowledged}
          onClick={() => dispatch({ type: "enterWaitingRoom" })}
        >
          Enter waiting room <ArrowRight size={19} aria-hidden="true" />
        </button>
        <button type="button" className={styles.textButton} onClick={onHelp}>
          See ways to attend
        </button>
      </section>
    </div>
  );
}

function WaitingRoom({ state, dispatch, onHelp }: Props) {
  const joinButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (state.admitted) joinButton.current?.focus();
  }, [state.admitted]);

  return (
    <div className={styles.flowGrid}>
      <section className={styles.card}>
        <span className={styles.iconWell}>
          <Clock3 size={25} aria-hidden="true" />
        </span>
        <h2>{visit.title}</h2>
        <div role="status">
          <p>
            {state.admitted
              ? "The simulated clinician is ready. Join when you’re ready."
              : "You’re in the practice waiting room. Try admitting yourself to see what happens when the clinician is ready."}
          </p>
        </div>
        {state.admitted ? (
          <button
            type="button"
            ref={joinButton}
            className={styles.button}
            onClick={() => dispatch({ type: "joinConsultation" })}
          >
            Join consultation <ArrowRight size={19} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            className={styles.button}
            onClick={() => dispatch({ type: "simulateAdmission" })}
          >
            Simulate clinician admission
          </button>
        )}
      </section>
      <section className={styles.card}>
        <h2>Your connection</h2>
        <p>
          {visitModes.find((mode) => mode.id === state.mode)?.label} selected.
          Camera and microphone are off.
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.secondary}`}
            onClick={() => dispatch({ type: "returnToPreparation" })}
          >
            Change how I join
          </button>
          <button type="button" className={styles.textButton} onClick={onHelp}>
            Help and alternatives
          </button>
          <button
            type="button"
            className={styles.textButton}
            onClick={() => dispatch({ type: "leave" })}
          >
            Leave waiting room
          </button>
        </div>
      </section>
    </div>
  );
}

function Consultation({
  state,
  dispatch,
  draft,
  setDraft,
  captions,
  toggleCaptions,
}: Props) {
  const composer = useRef<HTMLTextAreaElement>(null);
  const chatLog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const log = chatLog.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [state.messages]);
  const shared = accessOptions.filter(
    (option) => state.shareAccess && state.access.includes(option.id),
  );

  function send(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    dispatch({ type: "sendMessage", text: draft });
    setDraft("");
    composer.current?.focus();
  }

  return (
    <div className={styles.consultGrid}>
      <div className={styles.consultLeft}>
        <section
          className={styles.callPanel}
          aria-label="Practice consultation connection"
        >
          {state.mode === "video" ? (
            <div className={styles.callPhoto}>
              <Image
                src="/healthcare/demo-clinician.webp"
                alt=""
                fill
                sizes="(max-width: 720px) 100vw, 490px"
              />
              <p>
                {visit.clinician} <span>Fictional clinician · still image</span>
              </p>
            </div>
          ) : (
            <div className={styles.callText}>
              {state.mode === "text" ? (
                <MessageSquareText size={32} aria-hidden="true" />
              ) : (
                <Headphones size={32} aria-hidden="true" />
              )}
              <h2>
                {state.mode === "text"
                  ? "Text consultation"
                  : "Audio practice mode"}
              </h2>
              <p>
                {state.mode === "text"
                  ? "Type or use your AAC device. Take as much time as you need."
                  : "This visit uses typed messages to simulate the conversation."}
              </p>
            </div>
          )}
          <div className={styles.callControls}>
            <button
              type="button"
              className={`${styles.button} ${styles.secondary}`}
              aria-pressed={captions}
              onClick={toggleCaptions}
            >
              <Captions size={20} aria-hidden="true" /> Demo captions
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.danger}`}
              onClick={() => dispatch({ type: "leave" })}
            >
              Leave practice visit
            </button>
          </div>
        </section>
        {captions && (
          <div className={styles.summary} role="status">
            <strong>Sample caption</strong>
            <p>Amelia: Take your time. You can type when you’re ready.</p>
          </div>
        )}
        {shared.length > 0 && (
          <section className={styles.card}>
            <h2>Shared access preferences</h2>
            <ul className={styles.chips}>
              {shared.map((option) => (
                <li key={option.id}>{option.label}</li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <section
        className={styles.card}
        aria-labelledby="healthcare-chat-heading"
      >
        <h2 id="healthcare-chat-heading">Typed conversation</h2>
        <p>Use sample text. There is no time limit.</p>
        <div
          ref={chatLog}
          className={styles.chatLog}
          role="log"
          aria-labelledby="healthcare-chat-heading"
        >
          <ol>
            {state.messages.map((message) => (
              <li
                key={message.id}
                className={
                  message.speaker === "You" ? styles.myMessage : undefined
                }
              >
                <strong>{message.speaker}</strong>
                <p>{message.text}</p>
              </li>
            ))}
          </ol>
        </div>
        <div
          className={styles.quickPhrases}
          role="group"
          aria-label="Quick phrases"
        >
          {quickPhrases.map((phrase) => (
            <button
              type="button"
              className={styles.quickPhrase}
              key={phrase}
              onClick={() => dispatch({ type: "sendMessage", text: phrase })}
            >
              {phrase}
            </button>
          ))}
        </div>
        <form className={styles.messageForm} onSubmit={send}>
          <label htmlFor="healthcare-chat-input">Your message</label>
          <textarea
            id="healthcare-chat-input"
            ref={composer}
            rows={3}
            value={draft}
            maxLength={maxMessageLength}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button
            type="submit"
            className={styles.button}
            disabled={!draft.trim()}
          >
            Send message <ArrowRight size={18} aria-hidden="true" />
          </button>
        </form>
      </section>
    </div>
  );
}

export function VisitFlow(props: Props) {
  const { state, dispatch, onHelp } = props;
  const current = steps.findIndex((step) => step.id === state.stage);
  return (
    <>
      <ol className={styles.stepper} aria-label="Practice visit progress">
        {steps.map((step, index) => (
          <li
            key={step.id}
            aria-current={step.id === state.stage ? "step" : undefined}
            data-complete={index < current}
          >
            <span aria-hidden="true">
              {index < current ? <CircleCheck size={20} /> : index + 1}
            </span>
            {step.label}
          </li>
        ))}
      </ol>
      {state.stage === "prepare" && <Preparation {...props} />}
      {state.stage === "waiting" && <WaitingRoom {...props} />}
      {state.stage === "consultation" && <Consultation {...props} />}
      {state.stage === "complete" && (
        <section className={styles.card}>
          <span className={styles.iconWell}>
            <CircleCheck size={24} aria-hidden="true" />
          </span>
          <h2>You’ve left the practice room</h2>
          <p>
            The typed conversation was cleared. You can start over or review
            ways to attend an appointment.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.button}
              onClick={() => dispatch({ type: "reset" })}
            >
              Start a new practice visit
            </button>
            <button
              type="button"
              className={styles.textButton}
              onClick={onHelp}
            >
              Help and alternatives
            </button>
          </div>
        </section>
      )}
    </>
  );
}
