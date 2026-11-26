"use client";

import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Database,
  Headphones,
  HeartHandshake,
  HelpCircle,
  LockKeyhole,
  MessageSquareText,
  Settings2,
  Video,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useReducer, useRef, useState } from "react";

import { MAPABLE_LOGO_MARK_SRC } from "@/lib/brand/constants";
import {
  accessOptions,
  startHealthcarePreview,
  updateHealthcarePreview,
  visit,
  type VisitAction,
} from "@/packages/contracts/src/healthcare-preview";

import styles from "./healthcare.module.css";
import {
  AccessPreferences,
  HelpAndAlternatives,
  PublicEvidence,
} from "./PreviewTools";
import { VisitFlow } from "./VisitFlow";

const views = [
  { id: "appointments", name: "Appointments", icon: CalendarDays },
  { id: "access", name: "Access preferences", icon: Settings2 },
  { id: "help", name: "Help and alternatives", icon: HelpCircle },
  { id: "evidence", name: "Data sources", icon: Database },
] as const;
type View = (typeof views)[number]["id"] | "visit";

const headings: Record<View, string> = {
  appointments: "Your telehealth visit",
  access: "Your access preferences",
  help: "Help and alternatives",
  evidence: "Data sources",
  visit: "Practice visit",
};

const stageHeading = {
  prepare: "Prepare for your visit",
  waiting: "Waiting room",
  consultation: "Consultation",
  complete: "Practice visit complete",
};

const visitButton = {
  prepare: "Prepare for visit",
  waiting: "Return to waiting room",
  consultation: "Return to consultation",
  complete: "Review practice visit",
};

export function HealthcarePreview({
  mediaLab = false,
}: {
  mediaLab?: boolean;
}) {
  const [view, setView] = useState<View>("appointments");
  const [draft, setDraft] = useState("");
  const [captionOverride, setCaptionOverride] = useState<boolean>();
  const [state, dispatchVisit] = useReducer(
    updateHealthcarePreview,
    undefined,
    startHealthcarePreview,
  );
  const heading = useRef<HTMLHeadingElement>(null);
  const previousLocation = useRef("appointments");
  const location = view === "visit" ? state.stage : view;

  useEffect(() => {
    if (previousLocation.current !== location) heading.current?.focus();
    previousLocation.current = location;
  }, [location]);

  function dispatch(action: VisitAction) {
    if (action.type === "leave" || action.type === "reset") {
      setDraft("");
      setCaptionOverride(undefined);
    }
    dispatchVisit(action);
  }

  const captions = captionOverride ?? state.access.includes("captions");
  const selectedPreferences = accessOptions.filter((option) =>
    state.access.includes(option.id),
  );

  return (
    <div className={styles.app}>
      <a className={styles.skip} href="#healthcare-main">
        Skip to healthcare content
      </a>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <button
            type="button"
            className={styles.brand}
            onClick={() => setView("appointments")}
            aria-label="MapAble Healthcare appointments"
          >
            <Image src={MAPABLE_LOGO_MARK_SRC} alt="" width={31} height={36} />
            <span className={styles.brandName}>MapAble</span>
            <span className={styles.brandSection}>Healthcare</span>
          </button>
          <div className={styles.topbarActions}>
            <span className={styles.demoBadge}>
              <span aria-hidden="true" /> Synthetic preview
            </span>
            <button
              type="button"
              className={styles.textButton}
              onClick={() => setView("help")}
            >
              <HelpCircle size={19} aria-hidden="true" />
              <span>Help</span>
            </button>
          </div>
        </div>
      </header>

      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <nav aria-label="Healthcare navigation" className={styles.nav}>
            {views.map(({ id, name, icon: Icon }) => {
              const current =
                view === id || (id === "appointments" && view === "visit");
              return (
                <button
                  key={id}
                  type="button"
                  className={styles.navItem}
                  aria-current={current ? "page" : undefined}
                  onClick={() => setView(id)}
                >
                  <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                  <span>{name}</span>
                </button>
              );
            })}
          </nav>
          <div className={styles.sideNote}>
            <LockKeyhole size={19} aria-hidden="true" />
            <div>
              <strong>Practice safely</strong>
              <p>
                Use sample information. This visit stays in this browser tab.
              </p>
            </div>
          </div>
        </aside>

        <main className={styles.main} id="healthcare-main" tabIndex={-1}>
          {view === "visit" && (
            <button
              type="button"
              className={styles.back}
              onClick={() => setView("appointments")}
            >
              <ArrowRight
                size={17}
                className={styles.reverse}
                aria-hidden="true"
              />{" "}
              Appointments
            </button>
          )}
          <div className={styles.pageHeading}>
            <h1 ref={heading} tabIndex={-1}>
              {view === "visit" ? stageHeading[state.stage] : headings[view]}
            </h1>
            {view === "appointments" && (
              <p>
                Get ready, choose how you communicate, and join when you’re
                ready.
              </p>
            )}
            {view === "access" && (
              <p>Choose what makes this appointment easier for you.</p>
            )}
            {view === "evidence" && (
              <p>
                Australian public evidence and synthetic test data have
                different roles in MapAble Healthcare.
              </p>
            )}
          </div>

          {view === "appointments" && (
            <>
              <section
                className={styles.hero}
                aria-labelledby="healthcare-visit-title"
              >
                <div className={styles.heroPhoto} aria-hidden="true">
                  <Image
                    src="/healthcare/demo-clinician.webp"
                    alt=""
                    fill
                    sizes="(max-width: 660px) 100vw, 500px"
                    priority
                  />
                </div>
                <div className={styles.heroContent}>
                  <span className={styles.heroKicker}>
                    {state.stage === "prepare"
                      ? "Upcoming practice appointment"
                      : "Practice appointment"}
                  </span>
                  <h2 id="healthcare-visit-title">{visit.title}</h2>
                  <p>With {visit.clinician}, demo clinician</p>
                  <div className={styles.heroDetails}>
                    <CalendarDays size={19} aria-hidden="true" />
                    <p>
                      <span>{visit.date}</span>
                      <span>
                        {visit.time} · {visit.duration}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.heroButton}`}
                    onClick={() => setView("visit")}
                  >
                    {visitButton[state.stage]}{" "}
                    <ArrowRight size={19} aria-hidden="true" />
                  </button>
                </div>
              </section>

              <div className={styles.dashboardGrid}>
                <section
                  className={styles.card}
                  aria-labelledby="healthcare-before"
                >
                  <h2 id="healthcare-before">Before you join</h2>
                  <ul className={styles.checklist}>
                    <li>
                      <span className={styles.iconWell}>
                        <Headphones size={21} aria-hidden="true" />
                      </span>
                      <div>
                        <strong>Choose how to connect</strong>
                        <p>Use video, audio or text with AAC.</p>
                      </div>
                    </li>
                    <li>
                      <span className={styles.iconWell}>
                        <ClipboardCheck size={21} aria-hidden="true" />
                      </span>
                      <div>
                        <strong>Review what you share</strong>
                        <p>
                          Decide which access preferences your care team sees.
                        </p>
                      </div>
                    </li>
                    <li>
                      <span className={styles.iconWell}>
                        <Video size={21} aria-hidden="true" />
                      </span>
                      <div>
                        <strong>Join when you’re ready</strong>
                        <p>Your clinician admits you from the waiting room.</p>
                      </div>
                    </li>
                  </ul>
                </section>

                <section
                  className={`${styles.card} ${styles.accessCard}`}
                  aria-labelledby="healthcare-access-card"
                >
                  <span className={styles.iconWell}>
                    <HeartHandshake size={24} aria-hidden="true" />
                  </span>
                  <h2 id="healthcare-access-card">
                    Make the visit work for you
                  </h2>
                  {selectedPreferences.length ? (
                    <ul className={styles.chips}>
                      {selectedPreferences.map((option) => (
                        <li key={option.id}>{option.label}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      Ask for more time, use typed communication, or ask about
                      including an interpreter or support person.
                    </p>
                  )}
                  <button
                    type="button"
                    className={`${styles.button} ${styles.secondary}`}
                    onClick={() => setView("access")}
                  >
                    Edit access preferences{" "}
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                </section>
              </div>

              <button
                type="button"
                className={styles.footerHelp}
                onClick={() => setView("help")}
              >
                <MessageSquareText size={19} aria-hidden="true" /> Need a
                different way to attend? <span>Explore alternatives</span>
              </button>
            </>
          )}

          {view === "visit" && (
            <VisitFlow
              state={state}
              dispatch={dispatch}
              onAccess={() => setView("access")}
              onHelp={() => setView("help")}
              draft={draft}
              setDraft={setDraft}
              captions={captions}
              toggleCaptions={() => setCaptionOverride(!captions)}
            />
          )}
          {view === "access" && (
            <AccessPreferences
              state={state}
              dispatch={dispatch}
              onReturn={() => setView("visit")}
            />
          )}
          {view === "help" && (
            <HelpAndAlternatives
              callback={state.callback}
              onCallback={() => dispatch({ type: "callback" })}
            />
          )}
          {view === "evidence" && <PublicEvidence mediaLab={mediaLab} />}
        </main>
      </div>
    </div>
  );
}
