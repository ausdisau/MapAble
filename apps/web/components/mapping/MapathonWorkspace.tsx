"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  HeartHandshake,
  Info,
  List,
  Map as MapIcon,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import {
  DEMO_MAP_PLACES,
  EVIDENCE_FEATURES,
  MAPATHON_CHALLENGES,
  MODE_OPTIONS,
  PRACTICE_TARGET,
  ROLE_OPTIONS,
  SOURCE_OPTIONS,
  getChallenge,
  getEligiblePlaces,
  getFeature,
  validatePracticeDraft,
  type ContributorRole,
  type EvidenceSource,
  type FeatureId,
  type MapathonFocus,
  type MapathonView,
  type ParticipationMode,
  type PracticeDraft,
} from "@/lib/mapathon/demo";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

const focusRing = mapableCareFocusRing;
const controlClass =
  "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-[#0C1833] " +
  focusRing;

const methodHint: Record<ParticipationMode, string> = {
  remote: "You can contribute without leaving home. Look for dated, public information and note what is unknown.",
  field: "Only observe from safe public areas. Ask venue staff before recording on premises. Never enter an unsafe area to complete a challenge.",
  supported: "You can work with your chosen person, AAC, interpreter or other support. The observation still belongs to you.",
};

export function MapathonWorkspace() {
  const [focus, setFocus] = useState<MapathonFocus>("journeys");
  const [placeId, setPlaceId] = useState("demo-crossing");
  const [view, setView] = useState<MapathonView>("list");
  const [mode, setMode] = useState<ParticipationMode>("remote");
  const [role, setRole] = useState<ContributorRole>("researcher");
  const [featureId, setFeatureId] = useState<FeatureId>("path");
  const [source, setSource] = useState<EvidenceSource>("unknown");
  const [detail, setDetail] = useState("");
  const [width, setWidth] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [drafts, setDrafts] = useState<PracticeDraft[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const challenge = getChallenge(focus);
  const places = useMemo(() => getEligiblePlaces(focus), [focus]);
  const place = places.find((item) => item.id === placeId) ?? places[0];
  const feature = getFeature(featureId);
  const progress = Math.min(drafts.length, PRACTICE_TARGET);
  const selectedDrafts = drafts.filter((draft) => draft.challengeId === focus);
  const measurementMm = width.trim() === "" ? null : Number(width);

  const proposed = {
    placeId: place.id,
    challengeId: focus,
    featureId,
    role,
    mode,
    source,
    detail,
    measurementMm,
  };

  function chooseChallenge(nextFocus: MapathonFocus) {
    const next = getChallenge(nextFocus);
    setFocus(nextFocus);
    setPlaceId(getEligiblePlaces(nextFocus)[0].id);
    setFeatureId(next.featureIds[0]);
    setSource("unknown");
    setDetail("");
    setWidth("");
    setReviewing(false);
    setError("");
    setMessage("");
  }

  function chooseMode(nextMode: ParticipationMode) {
    setMode(nextMode);
    if (nextMode === "remote" && source === "direct") setSource("unknown");
    setReviewing(false);
    setError("");
  }

  function resetForm() {
    setSource("unknown");
    setDetail("");
    setWidth("");
    setReviewing(false);
    setError("");
    setMessage("Practice form cleared. Saved practice drafts remain in this tab.");
  }

  function startReview() {
    const problem = validatePracticeDraft(proposed);
    if (problem) {
      setError(problem);
      setReviewing(false);
      return;
    }
    setError("");
    setReviewing(true);
    setMessage("Review your fictional practice draft before adding it to this tab.");
  }

  function savePracticeDraft() {
    const problem = validatePracticeDraft(proposed);
    if (problem) {
      setError(problem);
      setReviewing(false);
      return;
    }
    const draft: PracticeDraft = {
      ...proposed,
      id: `practice-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      detail: detail.trim(),
      state: "local_practice_draft",
      synthetic: true,
      published: false,
    };
    setDrafts((previous) => [...previous, draft]);
    setSource("unknown");
    setDetail("");
    setWidth("");
    setReviewing(false);
    setError("");
    setMessage("Practice draft added locally. It has not been submitted, verified or published.");
  }

  function removeDraft(draftId: string) {
    setDrafts((previous) => previous.filter((item) => item.id !== draftId));
    setMessage("Practice draft removed from this tab. No public data was changed.");
  }

  return (
    <div className="bg-white text-[#0C1833]">
      <section className="overflow-hidden border-b border-slate-200 bg-[#F6FBFC]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(270px,0.65fr)] lg:items-center lg:px-8 lg:py-16">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E4F1F5] px-3 py-2 text-xs font-black uppercase tracking-[0.13em] text-[#005B7F]">
              <Compass className="h-4 w-4" aria-hidden="true" /> MapAble Signal / Mapping Days
            </p>
            <h1 className="max-w-3xl text-4xl font-black tracking-[-0.045em] sm:text-5xl">
              Map access together. Make every detail count.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-700">
              A community mapathon brings people together to explore entrances, paths,
              facilities, sensory spaces and public information. Join from home, in your
              community or with your chosen support.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#mapathon-workspace"
                className={`inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#005B7F] px-5 py-3 font-black text-white hover:bg-[#004766] ${focusRing}`}
              >
                Try the mapping challenge <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href="#how-it-works"
                className={`inline-flex min-h-12 items-center rounded-xl border-2 border-[#0C1833] bg-white px-5 py-3 font-black hover:bg-slate-50 ${focusRing}`}
              >
                How mapathons work
              </a>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-700">
              <ShieldCheck className="mr-2 inline h-4 w-4 text-[#005B7F]" aria-hidden="true" />
              Accessible participation. No GPS, personal diagnosis or photos needed.
            </p>
          </div>

          <div className="rounded-[1.6rem] bg-[#0C1833] p-6 text-white shadow-xl sm:p-8">
            <div className="flex items-center gap-2 text-sm font-bold text-[#F8C51C]">
              <Sparkles className="h-5 w-5" aria-hidden="true" /> Interactive demonstration
            </div>
            <h2 className="mt-3 text-2xl font-black leading-tight">Your community. Your pace.</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-200">
              Explore fictional map tasks and create practice drafts in this browser tab.
              Nothing is sent to a review queue or published to MapAble.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/20 pt-5 text-center">
              <div><span className="block text-2xl font-black text-white">5</span><span className="mt-1 block text-xs text-slate-200">challenge themes</span></div>
              <div><span className="block text-2xl font-black text-white">4</span><span className="mt-1 block text-xs text-slate-200">fictional places</span></div>
              <div><span className="block text-2xl font-black text-white">0</span><span className="mt-1 block text-xs text-slate-200">public posts</span></div>
            </div>
            <p className="mt-5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-slate-100">
              Prototype only - not a scheduled community event or a real place rating.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-5 py-10 lg:px-8">
        <section id="mapathon-workspace" aria-labelledby="missions-heading" className="scroll-mt-24 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-[#005B7F]">Step 1 / Pick a mission</p>
              <h2 id="missions-heading" className="mt-2 text-3xl font-black tracking-tight">Find a gap worth mapping</h2>
              <p className="mt-2 max-w-2xl text-slate-600">Choose an access topic. Every task focuses on a specific feature, never a promise that an entire place is accessible.</p>
            </div>
            <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold">Five practice missions</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" role="group" aria-label="Choose a mapping challenge">
            {MAPATHON_CHALLENGES.map((item, index) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={focus === item.id}
                onClick={() => chooseChallenge(item.id)}
                className={`group min-h-36 rounded-2xl border-2 p-4 text-left transition-colors ${focusRing} ${
                  focus === item.id
                    ? "border-[#005B7F] bg-[#EAF6FA] shadow-sm"
                    : "border-slate-200 bg-white hover:border-[#005B7F] hover:bg-slate-50"
                }`}
              >
                <span className={`mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-black ${focus === item.id ? "bg-[#005B7F] text-white" : "bg-[#F6FBFC] text-[#005B7F]"}`} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="block font-black leading-snug">{item.title}</span>
                <span className="mt-2 block text-sm text-slate-600">{item.shortTitle}</span>
                {focus === item.id ? <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-[#005B7F]"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Selected</span> : null}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="participation-heading" className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-5 sm:p-6">
            <p className="text-sm font-black uppercase tracking-wider text-[#005B7F]">Step 2 / Join your way</p>
            <h2 id="participation-heading" className="mt-2 text-2xl font-black">Choose how to contribute</h2>
            <fieldset className="mt-5 space-y-3">
              <legend className="mb-2 text-sm font-bold">Participation method</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {MODE_OPTIONS.map((item) => (
                  <label key={item.id} className={`flex min-h-12 cursor-pointer items-start gap-2 rounded-xl border-2 bg-white p-3 ${mode === item.id ? "border-[#005B7F]" : "border-slate-200"}`}>
                    <input
                      type="radio"
                      name="mapathon-mode"
                      value={item.id}
                      checked={mode === item.id}
                      onChange={() => chooseMode(item.id)}
                      className="mt-1 h-5 w-5 accent-[#005B7F]"
                    />
                    <span className="text-sm font-semibold">{item.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-700" role="status">{methodHint[mode]}</p>
            <fieldset className="mt-5 space-y-3">
              <legend className="text-sm font-bold">Your optional contribution role</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {ROLE_OPTIONS.map((item) => (
                  <label key={item.id} className={`flex min-h-12 cursor-pointer items-start gap-2 rounded-xl border-2 bg-white p-3 ${role === item.id ? "border-[#005B7F]" : "border-slate-200"}`}>
                    <input type="radio" name="mapathon-role" checked={role === item.id} onChange={() => { setRole(item.id); setReviewing(false); }} className="mt-1 h-5 w-5 accent-[#005B7F]" />
                    <span className="text-sm"><strong className="block">{item.label}</strong><span className="mt-1 block text-xs text-slate-600">{item.help}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-[#005B7F]">A shared goal</p>
                <h2 className="mt-2 text-2xl font-black">Practise together, not against each other</h2>
              </div>
              <Users className="h-8 w-8 text-[#005B7F]" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              For the prototype, collect up to three thoughtful practice records. This is
              your own local exercise - not a live team total or public leaderboard.
            </p>
            <div className="mt-6 flex items-end justify-between">
              <span className="font-bold">Your practice progress</span>
              <span className="font-black tabular-nums">{progress} of {PRACTICE_TARGET}</span>
            </div>
            <progress
              aria-label="Practice progress, not a live mapping count"
              className="mt-3 h-3 w-full accent-[#005B7F]"
              max={PRACTICE_TARGET}
              value={progress}
            >
              {progress} of {PRACTICE_TARGET}
            </progress>
            <p className="mt-3 text-sm text-slate-600">
              Good evidence includes a feature, source and uncertainty. Unknown is a useful result.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-[#005B7F]">
              <span className="rounded-lg bg-[#EAF6FA] px-3 py-2">No speed scoring</span>
              <span className="rounded-lg bg-[#EAF6FA] px-3 py-2">No compulsory fieldwork</span>
              <span className="rounded-lg bg-[#EAF6FA] px-3 py-2">Human verification before publication</span>
            </div>
          </div>
        </section>

        <section aria-labelledby="place-heading" className="space-y-5">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-[#005B7F]">Step 3 / Choose a location</p>
            <h2 id="place-heading" className="mt-2 text-3xl font-black tracking-tight">Explore the demonstration precinct</h2>
            <p className="mt-2 text-slate-600">These places and roads are entirely fictional. The map is illustrative, not navigation or an access rating.</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
            <div className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-black">Places for {challenge.shortTitle.toLowerCase()}</h3>
                <div className="flex rounded-xl border border-slate-300 bg-white p-1" role="group" aria-label="Choose map or list view">
                  <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold ${focusRing} ${view === "list" ? "bg-[#0C1833] text-white" : "text-[#0C1833]"}`}><List className="h-4 w-4" aria-hidden="true" /> List</button>
                  <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold ${focusRing} ${view === "map" ? "bg-[#0C1833] text-white" : "text-[#0C1833]"}`}><MapIcon className="h-4 w-4" aria-hidden="true" /> Map</button>
                </div>
              </div>
              {view === "list" ? (
                <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Fictional place options">
                  {places.map((item) => (
                    <button key={item.id} type="button" aria-pressed={place.id === item.id} onClick={() => { setPlaceId(item.id); setReviewing(false); }} className={`min-h-28 rounded-xl border-2 bg-white p-4 text-left ${focusRing} ${place.id === item.id ? "border-[#005B7F]" : "border-slate-200 hover:border-[#005B7F]"}`}>
                      <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#005B7F]"><MapPin className="h-4 w-4" aria-hidden="true" /> {item.category}</span>
                      <span className="block text-base font-black">{item.name}</span>
                      <span className="mt-1 block text-sm text-slate-600">{item.description}</span>
                      <span className="mt-2 block text-xs font-bold text-[#005B7F]">{place.id === item.id ? "Selected place" : "Select place"}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative min-h-72 overflow-hidden rounded-2xl border border-slate-300 bg-[#E9EBDD] sm:min-h-80" aria-label="Fictional precinct with selectable place markers">
                    <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 600 320" preserveAspectRatio="none">
                      <rect x="0" y="0" width="600" height="320" fill="#E9EBDD" />
                      <path d="M 0 250 L 600 75 M 100 0 L 370 320 M 0 100 L 600 280" stroke="#FFFFFF" strokeWidth="31" fill="none" />
                      <path d="M 0 250 L 600 75 M 100 0 L 370 320 M 0 100 L 600 280" stroke="#B6BFB9" strokeWidth="2" strokeDasharray="6 8" fill="none" />
                      <rect x="215" y="46" width="110" height="56" rx="10" fill="#C6DCC9" />
                      <rect x="410" y="155" width="130" height="96" rx="10" fill="#C6DCC9" />
                      <path d="M 0 310 Q 140 280 160 320" fill="none" stroke="#8CC3D1" strokeWidth="22" />
                    </svg>
                    {places.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={place.id === item.id}
                        aria-label={`Select ${item.name}`}
                        onClick={() => setPlaceId(item.id)}
                        style={{ left: `${item.x}%`, top: `${item.y}%` }}
                        className={`absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white text-white shadow-lg ${focusRing} ${place.id === item.id ? "bg-[#005B7F] ring-2 ring-[#0C1833]" : "bg-[#0C1833] hover:bg-[#005B7F]"}`}
                      >
                        <MapPin className="h-5 w-5" aria-hidden="true" />
                      </button>
                    ))}
                    <span className="absolute bottom-2 left-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-black text-[#0C1833]">Fictional map - not for travel</span>
                  </div>
                  <div role="status" className="rounded-xl border border-[#005B7F]/30 bg-white p-3 text-sm">
                    <strong>{place.name}</strong> selected. {place.description}
                  </div>
                  <p className="text-sm text-slate-600">Prefer not to use a map? Select List to choose the same places using labelled buttons.</p>
                </div>
              )}
            </div>
            <aside className="space-y-4 rounded-2xl bg-[#0C1833] p-5 text-white sm:p-6" aria-label="Selected challenge information">
              <p className="text-xs font-black uppercase tracking-wider text-[#F8C51C]">Your mapping brief</p>
              <h3 className="text-2xl font-black">{challenge.title}</h3>
              <p className="text-sm leading-relaxed text-slate-100">{challenge.description}</p>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="font-bold">Question to answer</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-100">{challenge.prompt}</p>
              </div>
              <p className="text-sm text-slate-200"><MapPin className="mr-2 inline h-4 w-4" aria-hidden="true" />{place.name}</p>
              <p className="text-xs text-slate-300">The exercise does not establish any red, amber or green status.</p>
            </aside>
          </div>
        </section>

        <section aria-labelledby="record-heading" className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <p className="text-sm font-black uppercase tracking-wider text-[#005B7F]">Step 4 / Record an observation</p>
            <h2 id="record-heading" className="mt-2 text-3xl font-black tracking-tight">Create a practice Field Note</h2>
            <p className="mt-3 text-slate-700">
              Describe a single feature and its evidence source. You can record a gap or an unknown -
              there is no score to earn and no need to claim an entire venue is accessible.
            </p>
            <form
              className="mt-6 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                startReview();
              }}
            >
              <div>
                <label htmlFor="mapathon-feature" className="block text-sm font-bold">What feature are you checking?</label>
                <select id="mapathon-feature" className={`mt-2 ${controlClass}`} value={featureId} onChange={(event) => { setFeatureId(event.target.value as FeatureId); setWidth(""); setReviewing(false); }}>
                  {EVIDENCE_FEATURES.filter((item) => challenge.featureIds.includes(item.id)).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
                <p className="mt-2 text-sm text-slate-600">{feature.hint}</p>
              </div>
              <fieldset className="space-y-3">
                <legend className="text-sm font-bold">Where does your information come from?</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SOURCE_OPTIONS.filter((item) => !(mode === "remote" && item.id === "direct")).map((item) => (
                    <label key={item.id} className={`flex min-h-12 cursor-pointer gap-3 rounded-xl border-2 p-3 ${source === item.id ? "border-[#005B7F] bg-[#F6FBFC]" : "border-slate-200"}`}>
                      <input type="radio" name="evidence-source" checked={source === item.id} onChange={() => { setSource(item.id); setWidth(""); setReviewing(false); }} className="mt-1 h-5 w-5 shrink-0 accent-[#005B7F]" />
                      <span className="text-sm"><strong className="block">{item.label}</strong><span className="mt-1 block text-slate-600">{item.help}</span></span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {feature.measurement === "mm" && source === "direct" ? (
                <div>
                  <label htmlFor="mapathon-width" className="block text-sm font-bold">Measured clear opening in millimetres (optional)</label>
                  <input id="mapathon-width" type="number" min={1} max={5000} step={1} inputMode="numeric" value={width} onChange={(event) => { setWidth(event.target.value); setReviewing(false); }} className={`mt-2 ${controlClass}`} placeholder="For example: 870" />
                  <p className="mt-2 text-sm text-slate-600">Only enter a direct measurement. A reported or estimated value belongs in the notes.</p>
                </div>
              ) : null}
              <div>
                <label htmlFor="mapathon-detail" className="block text-sm font-bold">What did you observe or find out?</label>
                <textarea
                  id="mapathon-detail"
                  rows={4}
                  minLength={8}
                  maxLength={400}
                  value={detail}
                  onChange={(event) => { setDetail(event.target.value); setReviewing(false); setError(""); }}
                  className={`mt-2 ${controlClass}`}
                  placeholder="For this fictional exercise, describe the feature, evidence or missing information."
                  aria-describedby="mapathon-note-help"
                />
                <p id="mapathon-note-help" className="mt-2 text-sm text-slate-600">8-400 characters. Do not include names, diagnoses, private addresses or identifying details. This stays in the current tab.</p>
              </div>
              {error ? <p role="alert" className="rounded-lg border border-red-400 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">{error}</p> : null}
              <div className="flex flex-wrap gap-3">
                <button type="submit" className={`inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#005B7F] px-5 py-3 font-black text-white hover:bg-[#004766] ${focusRing}`}><ClipboardCheck className="h-5 w-5" aria-hidden="true" /> Review practice draft</button>
                <button type="button" onClick={resetForm} className={`inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-400 px-4 py-3 font-bold ${focusRing}`}><RotateCcw className="h-4 w-4" aria-hidden="true" /> Clear form</button>
              </div>
            </form>
          </div>

          <aside className="space-y-5" aria-label="Draft review and progress">
            <div className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-5 sm:p-6">
              <h3 className="flex items-center gap-2 text-xl font-black"><ClipboardCheck className="h-5 w-5 text-[#005B7F]" aria-hidden="true" /> Review and save locally</h3>
              {reviewing ? (
                <div className="mt-4 space-y-4 text-sm">
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
                    <dt className="font-bold">Place</dt><dd>{place.name}</dd>
                    <dt className="font-bold">Feature</dt><dd>{feature.label}</dd>
                    <dt className="font-bold">Source</dt><dd>{SOURCE_OPTIONS.find((item) => item.id === source)?.label}</dd>
                    <dt className="font-bold">Method</dt><dd>{MODE_OPTIONS.find((item) => item.id === mode)?.label}</dd>
                    {measurementMm !== null ? <><dt className="font-bold">Width</dt><dd>{measurementMm} mm (practice)</dd></> : null}
                  </dl>
                  <p className="rounded-xl bg-white p-3 leading-relaxed">{detail.trim()}</p>
                  <p className="font-semibold text-[#0C1833]">Status: local practice only, unverified and unpublished.</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={savePracticeDraft} className={`min-h-12 rounded-xl bg-[#005B7F] px-4 py-3 font-bold text-white ${focusRing}`}>Add local practice draft</button>
                    <button type="button" onClick={() => setReviewing(false)} className={`min-h-12 rounded-xl border border-slate-400 px-4 py-3 font-bold ${focusRing}`}>Edit</button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p>Review a draft to see the feature, method, source and what remains uncertain.</p>
                  <p className="rounded-xl bg-white p-4">Nothing is uploaded or sent to a MapAble reviewer from this interface.</p>
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h3 className="text-xl font-black">Your local draft collection</h3>
              <p className="mt-2 text-sm text-slate-600">{drafts.length} practice {drafts.length === 1 ? "record" : "records"} in this tab. Refreshing the page clears them.</p>
              {drafts.length === 0 ? (
                <p className="mt-4 rounded-xl bg-[#F6FBFC] p-4 text-sm text-slate-700">No practice drafts yet. Review an observation to begin.</p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {drafts.map((draft) => (
                    <li key={draft.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold">{getFeature(draft.featureId).label}</p>
                          <p className="mt-1 text-xs text-slate-600">{DEMO_MAP_PLACES.find((item) => item.id === draft.placeId)?.name} / {getChallenge(draft.challengeId).title}</p>
                          <p className="mt-2 break-words text-sm text-slate-700">{draft.detail}</p>
                          <p className="mt-2 text-xs font-bold text-[#005B7F]">Local, not verified</p>
                        </div>
                        <button type="button" onClick={() => removeDraft(draft.id)} aria-label={`Remove practice draft ${draft.id}`} className={`min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-bold ${focusRing}`}>Remove</button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-3 text-xs text-slate-500">Current theme: {selectedDrafts.length} local {selectedDrafts.length === 1 ? "draft" : "drafts"}.</p>
              <p role="status" aria-live="polite" className="mt-4 rounded-lg bg-[#EAF6FA] p-3 text-sm font-semibold text-[#0C1833]">{message || "Ready to practise. No public contributions have been created."}</p>
            </div>
          </aside>
        </section>

        <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-24 space-y-5 border-t border-slate-200 pt-10">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-[#005B7F]">Community mapathon guide</p>
            <h2 id="how-heading" className="mt-2 text-3xl font-black tracking-tight">How a real MapAble mapping day could work</h2>
            <p className="mt-2 max-w-3xl text-slate-700">A real event needs accessible planning, trained facilitators, safe consent, evidence moderation and publication controls. This interactive workspace demonstrates the contribution journey only.</p>
          </div>
          <ol className="grid gap-4 md:grid-cols-4">
            {[
              { title: "Plan together", text: "Agree on a useful area, safe scope and options to map remotely or in person." },
              { title: "Map a feature", text: "Record dated, specific observations; do not guess inaccessible details." },
              { title: "Review evidence", text: "Human reviewers verify sources, resolve discrepancies and invite correction." },
              { title: "Share responsibly", text: "Only authorised reviewed details become scoped public MapAble Signals." },
            ].map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-slate-200 p-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0C1833] font-black text-white" aria-hidden="true">{index + 1}</span>
                <h3 className="mt-4 font-black">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{step.text}</p>
              </li>
            ))}
          </ol>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-[#F6FBFC] p-6">
              <h3 className="flex items-center gap-2 text-xl font-black"><ShieldCheck className="h-6 w-6 text-[#005B7F]" aria-hidden="true" /> Safety and privacy first</h3>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
                <li>Never trespass or investigate unsafe roads, crossings, equipment or buildings.</li>
                <li>Request permission before observing inside businesses or photographing premises.</li>
                <li>No identifying photos, private residences, diagnoses or personal location traces.</li>
                <li>Record feature-level facts, their sources, date and uncertainty. Unknown is valid.</li>
                <li>Do not convert a community draft directly into a verified RAGU signal.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6">
              <h3 className="flex items-center gap-2 text-xl font-black"><HeartHandshake className="h-6 w-6 text-[#005B7F]" aria-hidden="true" /> Bring your community</h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-700">A future pilot could be hosted by a council, community group, university or local organisation with disabled people leading the design and decisions. Joining, declining and working remotely must be equally respected.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/contact" className={`inline-flex min-h-12 items-center rounded-xl bg-[#005B7F] px-4 py-3 font-bold text-white ${focusRing}`}>Discuss a mapping event</Link>
                <Link href="/add-access-info" className={`inline-flex min-h-12 items-center rounded-xl border-2 border-[#0C1833] px-4 py-3 font-bold ${focusRing}`}>Existing access info demo</Link>
              </div>
              <p className="mt-3 flex items-start gap-2 text-xs text-slate-600"><Info className="h-4 w-4 shrink-0" aria-hidden="true" /> These links do not register you for an event. The existing add-access page is also a demonstration.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
