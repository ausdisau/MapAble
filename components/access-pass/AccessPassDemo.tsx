"use client";

import React, { useMemo, useState } from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type PassFields = {
  mobilityAids: string;
  communication: string;
  sensory: string;
  toiletAccess: string;
  transportPickup: string;
  assistanceAnimal: string;
  supportWorker: string;
  emergencyContacts: string;
  whatHelps: string;
  pleaseDoNot: string;
};

const emptyPass: PassFields = {
  mobilityAids: "",
  communication: "",
  sensory: "",
  toiletAccess: "",
  transportPickup: "",
  assistanceAnimal: "",
  supportWorker: "",
  emergencyContacts: "",
  whatHelps: "",
  pleaseDoNot: "",
};

const recipients = [
  { id: "provider", label: "Provider" },
  { id: "driver", label: "Driver" },
  { id: "venue", label: "Venue" },
  { id: "coordinator", label: "Support coordinator" },
  { id: "family", label: "Family / carer" },
] as const;

export function AccessPassDemo() {
  const [pass, setPass] = useState<PassFields>(emptyPass);
  const [recipient, setRecipient] = useState<(typeof recipients)[number]["id"]>("provider");
  const [purpose, setPurpose] = useState("Appointment access planning");
  const [expiry, setExpiry] = useState("");

  const sharedPreview = useMemo(() => {
    const base = [
      pass.mobilityAids && `Mobility aids: ${pass.mobilityAids}`,
      pass.communication && `Communication: ${pass.communication}`,
      pass.sensory && `Sensory: ${pass.sensory}`,
      pass.toiletAccess && `Toilet/access: ${pass.toiletAccess}`,
      pass.whatHelps && `What helps me: ${pass.whatHelps}`,
      pass.pleaseDoNot && `Please do not: ${pass.pleaseDoNot}`,
    ].filter(Boolean);

    if (recipient === "driver" || recipient === "coordinator") {
      if (pass.transportPickup) base.push(`Transport pickup: ${pass.transportPickup}`);
    }
    if (recipient === "provider" || recipient === "coordinator" || recipient === "family") {
      if (pass.supportWorker) base.push(`Support worker preferences: ${pass.supportWorker}`);
    }
    if (recipient === "venue") {
      if (pass.assistanceAnimal) base.push(`Assistance animal: ${pass.assistanceAnimal}`);
    }
    if (recipient === "family" || recipient === "coordinator") {
      if (pass.emergencyContacts) base.push(`Emergency contacts: ${pass.emergencyContacts}`);
    }
    return base;
  }, [pass, recipient]);

  function update<K extends keyof PassFields>(key: K, value: PassFields[K]) {
    setPass((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="bg-white text-[#0C1833]">
      <section className="border-b border-slate-200 bg-[#F6FBFC]">
        <div className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
          <h1 className="text-4xl font-black tracking-[-0.04em] md:text-5xl">
            Share your access needs once, on your terms.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Access Pass stays on this device in demo mode. MapAble does not send sensitive access
            needs to a server from this page.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-4xl gap-8 px-5 py-10 lg:px-8">
        <form
          className="space-y-4 rounded-2xl border border-slate-200 p-5"
          onSubmit={(event) => event.preventDefault()}
        >
          <Field
            id="mobility"
            label="Mobility aids"
            value={pass.mobilityAids}
            onChange={(v) => update("mobilityAids", v)}
          />
          <Field
            id="communication"
            label="Communication preferences"
            value={pass.communication}
            onChange={(v) => update("communication", v)}
          />
          <Field
            id="sensory"
            label="Sensory preferences"
            value={pass.sensory}
            onChange={(v) => update("sensory", v)}
          />
          <Field
            id="toilet"
            label="Toilet / access requirements"
            value={pass.toiletAccess}
            onChange={(v) => update("toiletAccess", v)}
          />
          <Field
            id="pickup"
            label="Transport pickup notes"
            value={pass.transportPickup}
            onChange={(v) => update("transportPickup", v)}
          />
          <Field
            id="animal"
            label="Assistance animal"
            value={pass.assistanceAnimal}
            onChange={(v) => update("assistanceAnimal", v)}
          />
          <Field
            id="worker"
            label="Support worker preferences"
            value={pass.supportWorker}
            onChange={(v) => update("supportWorker", v)}
          />
          <Field
            id="emergency"
            label="Emergency contacts"
            value={pass.emergencyContacts}
            onChange={(v) => update("emergencyContacts", v)}
          />
          <Field
            id="helps"
            label="What helps me"
            value={pass.whatHelps}
            onChange={(v) => update("whatHelps", v)}
          />
          <Field
            id="donot"
            label="Please do not"
            value={pass.pleaseDoNot}
            onChange={(v) => update("pleaseDoNot", v)}
          />
        </form>

        <section aria-labelledby="sharing-heading" className="rounded-2xl border border-slate-200 p-5">
          <h2 id="sharing-heading" className="text-xl font-black">
            Sharing preview
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="recipient" className="text-sm font-semibold">
                Recipient
              </label>
              <select
                id="recipient"
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
                value={recipient}
                onChange={(e) =>
                  setRecipient(e.target.value as (typeof recipients)[number]["id"])
                }
              >
                {recipients.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="purpose" className="text-sm font-semibold">
                Purpose
              </label>
              <input
                id="purpose"
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="expiry" className="text-sm font-semibold">
                Expiry
              </label>
              <input
                id="expiry"
                type="date"
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-[#F6FBFC] p-4 text-sm">
            <p className="font-semibold">
              Would share with {recipients.find((r) => r.id === recipient)?.label} for “{purpose}
              ”{expiry ? ` until ${expiry}` : ""}.
            </p>
            {sharedPreview.length === 0 ? (
              <p className="mt-2 text-slate-600">No fields filled yet.</p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {sharedPreview.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
            >
              Revoke (demo)
            </button>
            <button
              type="button"
              className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
            >
              Audit log placeholder
            </button>
          </div>
        </section>

        <section aria-labelledby="privacy-heading" className="rounded-2xl bg-slate-50 p-5">
          <h2 id="privacy-heading" className="text-xl font-black">
            Privacy principles
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Private by default</li>
            <li>Consent-controlled</li>
            <li>Role-based</li>
            <li>Plain-language sharing</li>
            <li>Revocable where practical</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <textarea
        id={id}
        className="mt-1 min-h-20 w-full rounded-xl border border-slate-300 px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
