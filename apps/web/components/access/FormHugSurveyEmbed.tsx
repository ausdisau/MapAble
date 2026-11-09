"use client";
import { useEffect, useRef, useState } from "react";
import { FORMHUG_SURVEYS, type FormHugSurveyKind } from "@/lib/access/formhug-surveys";

/** Third-party code loads after explicit choice, never during initial page render. */
export function FormHugSurveyEmbed({ survey }: { survey: FormHugSurveyKind }) {
  const config = FORMHUG_SURVEYS[survey];
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!active || !root.current) return;
    const mount = root.current;
    const script = document.createElement("script");
    script.src = config.embed;
    script.async = true;
    script.onerror = () => setFailed(true);
    mount.appendChild(script);
    return () => {
      script.onerror = null;
      script.remove();
      mount.replaceChildren();
    };
  }, [active, config.embed]);

  return (
    <section aria-labelledby="formhug-title" className="rounded-2xl border border-slate-300 bg-white p-6">
      <h2 id="formhug-title" className="text-2xl font-bold">{config.title}</h2>
      <p className="mt-3 text-base leading-relaxed text-slate-700">
        FormHug is an external service. Loading this survey connects your browser
        to FormHug. Survey responses are processed by FormHug for the survey owner, not
        automatically published to MapAble maps, PalsyPod or Mailchimp. You
        decide whether to submit.
      </p>
      {!active ? (
        <button type="button" onClick={() => setActive(true)}
          className="mt-5 min-h-12 rounded-xl bg-[#153B72] px-5 py-3 font-semibold text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#E7A72A]">
          Load FormHug survey
        </button>
      ) : (
        <>
          <div ref={root} className="mt-5 min-w-0" aria-label={config.title} />
          {failed && <p role="alert" className="mt-3">The embedded survey did not load. Use the direct link below.</p>}
        </>
      )}
      <p className="mt-4">
        <a href={config.url} target="_blank" rel="noopener noreferrer"
          className="font-semibold text-[#153B72] underline underline-offset-4 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2">
          Open the survey directly in a new tab
        </a>
      </p>
      <p className="mt-4 text-sm text-slate-600">
        You may use AAC, dictation, a screen reader or a chosen supporter.
        Assistive-technology and mobile testing of the third-party embed remains pending.
      </p>
    </section>
  );
}
