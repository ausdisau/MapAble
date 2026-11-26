"use client";

import {
  ArrowRight,
  CircleCheck,
  ExternalLink,
  Headphones,
  LockKeyhole,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type Dispatch } from "react";

import {
  accessOptions,
  type HealthcarePreview,
  type VisitAction,
  type VisitMode,
} from "@/packages/contracts/src/healthcare-preview";

import { healthcareEvidence, healthcareSourceLinks } from "./evidence";
import styles from "./healthcare.module.css";

export function AccessPreferences({
  state,
  dispatch,
  onReturn,
}: {
  state: HealthcarePreview;
  dispatch: Dispatch<VisitAction>;
  onReturn: () => void;
}) {
  const access = accessOptions.filter((option) =>
    state.access.includes(option.id),
  );
  return (
    <div className={styles.flowGrid}>
      <section className={styles.card}>
        <fieldset className={styles.fieldset}>
          <legend>Communication and support</legend>
          <div className={styles.preferenceRows}>
            {accessOptions.map((option) => (
              <label
                key={option.id}
                htmlFor={`healthcare-access-${option.id}`}
                className={styles.checkOption}
              >
                <input
                  type="checkbox"
                  id={`healthcare-access-${option.id}`}
                  checked={state.access.includes(option.id)}
                  onChange={() =>
                    dispatch({ type: "toggleAccess", option: option.id })
                  }
                />
                <span>
                  {option.label}
                  <small>{option.detail}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className={styles.card}>
        <span className={styles.iconWell}>
          <LockKeyhole size={23} aria-hidden="true" />
        </span>
        <h2>Decide what to share</h2>
        <p>
          Sharing here shows what the simulated clinician would see for this
          visit. No interpreter or support person is contacted.
        </p>
        <label htmlFor="healthcare-share-access" className={styles.checkOption}>
          <input
            type="checkbox"
            id="healthcare-share-access"
            checked={state.shareAccess}
            onChange={(event) =>
              dispatch({ type: "shareAccess", share: event.target.checked })
            }
          />
          <span>Share my selected preferences for this visit</span>
        </label>
        <div className={styles.summary} aria-live="polite">
          <strong>Shared in this preview</strong>
          {state.shareAccess && access.length > 0 ? (
            <ul>
              {access.map((option) => (
                <li key={option.id}>{option.label}</li>
              ))}
            </ul>
          ) : (
            <p>No preferences shared.</p>
          )}
        </div>
        <button type="button" className={styles.button} onClick={onReturn}>
          {state.stage === "prepare"
            ? "Continue to visit preparation"
            : "Return to practice visit"}{" "}
          <ArrowRight size={19} aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}

export function HelpAndAlternatives({
  callback,
  onCallback,
}: {
  callback: boolean;
  onCallback: () => void;
}) {
  return (
    <div className={styles.flowGrid}>
      <section className={styles.card}>
        <span className={styles.iconWell}>
          <Headphones size={22} aria-hidden="true" />
        </span>
        <h2>Choose another way to attend</h2>
        <p>
          In this preview, you can choose text or audio during visit
          preparation. For a real appointment, ask your clinic for a phone,
          relay or in-person option and confirm communication supports in
          advance.
        </p>
        <button
          type="button"
          className={styles.button}
          disabled={callback}
          onClick={onCallback}
        >
          {callback ? "Callback simulated" : "Simulate a callback request"}
        </button>
        <div role="status">
          {callback && (
            <p className={styles.feedback}>
              <CircleCheck size={19} aria-hidden="true" /> This was a practice
              request. No clinic has been contacted.
            </p>
          )}
        </div>
      </section>
      <section className={styles.card}>
        <h2>Australian support services</h2>
        <p>
          For a medical emergency, call Triple Zero (<a href="tel:000">000</a>).
        </p>
        <ul className={styles.resourceList}>
          <li>
            <a href="https://www.accesshub.gov.au/about-the-nrs">
              National Relay Service{" "}
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          </li>
          <li>
            <a href="https://www.healthdirect.gov.au/">
              healthdirect <ExternalLink size={16} aria-hidden="true" />
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}

export function PublicEvidence({ mediaLab }: { mediaLab: boolean }) {
  return (
    <div className={styles.evidenceStack}>
      <section
        className={styles.card}
        aria-labelledby="healthcare-evidence-title"
      >
        <h2 id="healthcare-evidence-title">
          Access to healthcare in Australia
        </h2>
        <p>{healthcareEvidence.period}</p>
        <dl className={styles.stats}>
          {healthcareEvidence.measures.map((measure) => (
            <div key={measure.label}>
              <dt>
                {measure.label}
                <small className={styles.cohort}>{measure.cohort}</small>
              </dt>
              <dd>{measure.value}</dd>
            </div>
          ))}
        </dl>
        <a href={healthcareEvidence.url}>
          {healthcareEvidence.source}{" "}
          <ExternalLink size={16} aria-hidden="true" />
        </a>
      </section>
      <section
        className={styles.card}
        aria-labelledby="healthcare-other-sources"
      >
        <h2 id="healthcare-other-sources">Project and data references</h2>
        <ul className={styles.sourceList}>
          {healthcareSourceLinks.map((source) => (
            <li key={source.url}>
              <a href={source.url}>
                {source.name} <ExternalLink size={16} aria-hidden="true" />
              </a>
              <p>{source.summary}</p>
            </li>
          ))}
        </ul>
        {mediaLab && (
          <Link href="/telehealth/preview/media">
            Open the local LiveKit media lab{" "}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
      </section>
    </div>
  );
}

type DeviceCheckStatus = "idle" | "checking" | "passed" | "blocked";

export function DeviceCheck({ mode }: { mode: Exclude<VisitMode, "text"> }) {
  const [status, setStatus] = useState<DeviceCheckStatus>("idle");
  const activeRequest = useRef(0);

  useEffect(
    () => () => {
      activeRequest.current += 1;
    },
    [],
  );

  async function testDevices() {
    const request = ++activeRequest.current;
    setStatus("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: mode === "video",
        audio: true,
      });
      stream.getTracks().forEach((track) => track.stop());
      if (request === activeRequest.current) setStatus("passed");
    } catch {
      if (request === activeRequest.current) setStatus("blocked");
    }
  }

  const buttonLabel =
    mode === "video" ? "Check camera and microphone" : "Check microphone";

  return (
    <div className={styles.deviceCheck}>
      <button
        type="button"
        className={`${styles.button} ${styles.secondary}`}
        disabled={status === "checking"}
        onClick={() => void testDevices()}
      >
        {status === "checking" ? "Checking devices…" : buttonLabel}
      </button>
      <p>
        Optional. Your browser may ask for permission. The check turns devices
        off immediately afterwards.
      </p>
      <div aria-live="polite">
        {status === "passed" && (
          <p className={styles.feedback}>
            <CircleCheck size={18} aria-hidden="true" /> Devices opened and are
            off again.
          </p>
        )}
        {status === "blocked" && (
          <p>
            Couldn’t open your devices. You can continue without the check, or
            choose Text.
          </p>
        )}
      </div>
    </div>
  );
}
