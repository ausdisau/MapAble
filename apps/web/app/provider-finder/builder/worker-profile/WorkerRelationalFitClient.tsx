"use client";

import { useEffect, useId, useState } from "react";

import { COMMUNICATION_MODES, type WorkerFitDeclaration } from "@/lib/support-builder/relational-fit";
import { RelationalFitDisclosure } from "@/components/support-builder/RelationalFitDisclosure";

type Existing = {
  communicationModes: string[];
  routineStyle: string;
  interactionStyle: string;
  initiativeStyle: string;
  continuityStyle: string;
  consentedAt: string;
};
type WorkerProfileSummary = {
  id: string;
  displayName: string;
  organisation: { name: string };
  relationalFitProfile: Existing | null;
};

const STYLES = [
  {
    key: "routineStyle" as const,
    label: "How I organise routines",
    options: [["not_stated", "Prefer not to state"], ["structured", "Structured routines"], ["flexible", "Flexible routines"], ["adaptable", "Can adapt approach"]],
  },
  {
    key: "interactionStyle" as const,
    label: "Conversation style",
    options: [["not_stated", "Prefer not to state"], ["quiet", "Quiet support"], ["conversational", "Conversational support"], ["adaptable", "Can adapt approach"]],
  },
  {
    key: "initiativeStyle" as const,
    label: "How I offer assistance",
    options: [["not_stated", "Prefer not to state"], ["ask_first", "Ask first"], ["offer_options", "Offer options"], ["adaptable", "Can adapt approach"]],
  },
  {
    key: "continuityStyle" as const,
    label: "Working arrangement preference",
    options: [["not_stated", "Prefer not to state"], ["regular", "Regular support arrangements"], ["variable", "Variable shifts"], ["adaptable", "Can adapt arrangements"]],
  },
];

const emptyProfile = {
  communicationModes: [] as WorkerFitDeclaration["communicationModes"],
  routineStyle: "not_stated" as WorkerFitDeclaration["routineStyle"],
  interactionStyle: "not_stated" as WorkerFitDeclaration["interactionStyle"],
  initiativeStyle: "not_stated" as WorkerFitDeclaration["initiativeStyle"],
  continuityStyle: "not_stated" as WorkerFitDeclaration["continuityStyle"],
};

export default function WorkerRelationalFitClient() {
  const titleId = useId();
  const [profiles, setProfiles] = useState<WorkerProfileSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [values, setValues] = useState(emptyProfile);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/provider-finder/builder/relational-fit/worker-profile", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) {
        setMessage(response.status === 401
          ? "Sign in with your worker-linked MapAble account to review these settings."
          : "Worker settings are unavailable in this preview.");
        return;
      }
      const payload = await response.json() as { profiles: WorkerProfileSummary[] };
      setProfiles(payload.profiles);
      const selected = payload.profiles.find((item) => item.id === selectedId) ?? payload.profiles[0];
      if (selected) apply(selected);
    } catch {
      setMessage("Could not load your worker profiles. No changes were made.");
    } finally {
      setLoading(false);
    }
  }

  function apply(profile: WorkerProfileSummary) {
    setSelectedId(profile.id);
    const info = profile.relationalFitProfile;
    setValues({
      communicationModes: (info?.communicationModes ?? []).filter(
        (mode): mode is WorkerFitDeclaration["communicationModes"][number] =>
          COMMUNICATION_MODES.some((allowed) => allowed === mode),
      ),
      routineStyle: validOption(info?.routineStyle, ["not_stated", "structured", "flexible", "adaptable"]),
      interactionStyle: validOption(info?.interactionStyle, ["not_stated", "quiet", "conversational", "adaptable"]),
      initiativeStyle: validOption(info?.initiativeStyle, ["not_stated", "ask_first", "offer_options", "adaptable"]),
      continuityStyle: validOption(info?.continuityStyle, ["not_stated", "regular", "variable", "adaptable"]),
    });
    setConsent(false);
    setMessage("");
  }

  useEffect(() => {
    void load();
    // Load once at entry; never share this profile with an AI assistant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!consent) {
      setMessage("Please review the disclosure and select the voluntary opt-in checkbox.");
      return;
    }
    if (!values.communicationModes.length) {
      setMessage("Choose at least one communication method you can support.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/provider-finder/builder/relational-fit/worker-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...values, workerProfileId: selectedId, consentToMatching: true }),
      });
      if (!response.ok) {
        setMessage("Your workstyle settings were not saved. Check sign-in, consent and preview availability.");
        return;
      }
      setMessage("Voluntary workstyle settings saved. They may appear in authorised participant matching previews.");
      setConsent(false);
      // Refreshing the profile preserves server truth; no client-side fake save.
    } catch {
      setMessage("Saving failed. No consent was confirmed.");
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    if (!selectedId) return;
    setBusy(true);
    setMessage("");
    try {
      const url = "/api/provider-finder/builder/relational-fit/worker-profile?workerProfileId=" +
        encodeURIComponent(selectedId);
      const response = await fetch(url, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!response.ok) {
        setMessage("Withdrawal could not be confirmed. Contact human support.");
        return;
      }
      setValues(emptyProfile);
      setConsent(false);
      setMessage("Workstyle participation withdrawn and the stored declarations removed.");
    } catch {
      setMessage("Withdrawal could not be confirmed. Contact human support.");
    } finally {
      setBusy(false);
    }
  }

  function setStyle<K extends keyof typeof emptyProfile>(
    key: K,
    value: typeof emptyProfile[K],
  ) {
    setValues((old) => ({ ...old, [key]: value }));
  }

  const selected = profiles.find((profile) => profile.id === selectedId);

  return (
    <main aria-labelledby={titleId} className="mx-auto max-w-2xl space-y-5 px-4 py-7">
      <a href="/provider-finder/builder" className="text-sm text-primary underline">
        Back to Support Builder
      </a>
      <header>
        <h1 id={titleId} className="font-heading text-2xl font-semibold">
          Voluntary worker workstyle settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Describe how you deliver support. This is not a psychological
          assessment, job application or quality ranking. Participation is optional
          and can be withdrawn.
        </p>
      </header>
      {loading ? <p role="status">Loading linked worker profiles…</p> : null}
      {message ? <p role="status" className="text-sm">{message}</p> : null}
      {!loading && profiles.length === 0 && (
        <p className="text-sm">
          No worker profile is linked to your account, or this preview is unavailable.
          Profile ownership must be verified before preferences can be stored.
        </p>
      )}
      {profiles.length > 0 && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <label className="block text-sm font-semibold">
            My linked worker profile
            <select
              className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3"
              value={selectedId}
              onChange={(event) => {
                const match = profiles.find((profile) => profile.id === event.target.value);
                if (match) apply(match);
              }}
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.displayName} — {profile.organisation.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Communication methods I can support</legend>
            {COMMUNICATION_MODES.map((mode) => (
              <label key={mode} className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={values.communicationModes.includes(mode)}
                  onChange={(event) => {
                    setValues((old) => ({
                      ...old,
                      communicationModes: event.target.checked
                        ? [...old.communicationModes, mode]
                        : old.communicationModes.filter((m) => m !== mode),
                    }));
                  }}
                />
                {mode === "aac" ? "AAC" : mode === "auslan" ? "Auslan" : mode === "easy_read" ? "Easy Read" : mode}
              </label>
            ))}
            <p className="text-xs text-muted-foreground">
              Declare only methods you can actually use. Additional training
              or independent competency evidence may still be required.
            </p>
          </fieldset>
          {STYLES.map((style) => (
            <label key={style.key} className="block text-sm font-semibold">
              {style.label}
              <select
                className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3 font-normal"
                value={values[style.key]}
                onChange={(event) => setStyle(style.key, event.target.value as never)}
              >
                {style.options.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          ))}
          <RelationalFitDisclosure />
          <label className="flex min-h-12 items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-primary"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            <span>
              I choose to share these workstyle declarations with authorised
              participant matching previews. I understand I can withdraw.
              This is not consent to AI personality profiling or employment screening.
            </span>
          </label>
          <button
            type="button"
            disabled={busy || !selectedId || !consent}
            onClick={() => void save()}
            className="min-h-12 w-full rounded-lg bg-primary px-3 font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Processing…" : "Save voluntary workstyle"}
          </button>
          <button
            type="button"
            disabled={busy || !selectedId || !selected?.relationalFitProfile}
            onClick={() => void withdraw()}
            className="min-h-12 w-full rounded-lg border border-destructive px-3 font-semibold text-destructive disabled:opacity-50"
          >
            Withdraw and delete my workstyle declaration
          </button>
          <p className="text-xs text-muted-foreground">
            Only your worker-linked account may change these settings.
            Withdrawing does not remove any independent professional credential
            or record required to be held under applicable law.
          </p>
        </div>
      )}
    </main>
  );
}

function validOption<T extends string>(value: string | undefined, allowed: readonly T[]): T {
  return allowed.find((option) => option === value) ?? allowed[0]!;
}
