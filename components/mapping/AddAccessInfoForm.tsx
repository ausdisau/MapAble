"use client";

import Link from "next/link";
import React, { useState } from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type ModerationStatus =
  | "submitted"
  | "in review"
  | "published"
  | "needs more info"
  | "rejected";

export function AddAccessInfoForm() {
  const [status, setStatus] = useState<ModerationStatus | null>(null);
  const [consent, setConsent] = useState(false);

  return (
    <div className="bg-white text-[#0C1833]">
      <section className="border-b border-slate-200 bg-[#F6FBFC]">
        <div className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
          <h1 className="text-4xl font-black tracking-[-0.04em]">Add access info</h1>
          <p className="mt-4 text-lg text-slate-600">
            Share practical access details. Submissions are demo-handled locally for now and
            show a moderation status only in this session.
          </p>
        </div>
      </section>

      <form
        className="mx-auto max-w-3xl space-y-4 px-5 py-10 lg:px-8"
        onSubmit={(event) => {
          event.preventDefault();
          if (!consent) return;
          setStatus("submitted");
        }}
      >
        <Field id="place-name" label="Place name" required />
        <Field id="place-address" label="Address" required />
        <div>
          <label htmlFor="place-category" className="text-sm font-semibold">
            Category
          </label>
          <select
            id="place-category"
            required
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
          >
            <option value="">Select category</option>
            <option value="cafe_restaurant">Cafe / restaurant</option>
            <option value="library">Library</option>
            <option value="public_toilet">Public toilet</option>
            <option value="shop">Shop</option>
            <option value="park">Park</option>
            <option value="other">Other</option>
          </select>
        </div>
        <Field id="entrance" label="Entrance access" />
        <Field id="door-width" label="Doorway width if known (mm)" />
        <Field id="step-height" label="Step height if known (mm)" />
        <Field id="toilet" label="Toilet access" />
        <Field id="parking" label="Parking / drop-off" />
        <div>
          <label htmlFor="photos" className="text-sm font-semibold">
            Photos
          </label>
          <input
            id="photos"
            type="file"
            accept="image/*"
            multiple
            className="mt-1 block w-full text-sm"
          />
          <p className="mt-1 text-xs text-amber-900">
            Reminder: do not include people in photos without consent.
          </p>
        </div>
        <div>
          <label htmlFor="sensory" className="text-sm font-semibold">
            Sensory notes
          </label>
          <textarea
            id="sensory"
            className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>
        <Field id="staff" label="Staff assistance" />
        <div>
          <label htmlFor="confidence" className="text-sm font-semibold">
            Confidence
          </label>
          <select
            id="confidence"
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
            defaultValue="medium"
          >
            <option value="high">High — measured or recently verified</option>
            <option value="medium">Medium — observed carefully</option>
            <option value="low">Low — estimate</option>
          </select>
        </div>
        <label className="flex min-h-11 items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
          />
          <span>
            I confirm this information is respectful, not trespassed, and does not include
            identifiable people without consent.
          </span>
        </label>

        <section aria-labelledby="guidelines-heading" className="rounded-2xl bg-slate-50 p-4">
          <h2 id="guidelines-heading" className="font-black">
            Mapper guidelines
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Do not trespass</li>
            <li>Do not photograph people without consent</li>
            <li>Be respectful to staff</li>
            <li>Measurements are helpful but optional</li>
            <li>Label estimates clearly</li>
          </ul>
        </section>

        <button
          type="submit"
          className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-5 text-sm font-black text-white ${mapableCareFocusRing}`}
        >
          Submit access info (demo)
        </button>

        {status ? (
          <p className="rounded-xl border border-slate-200 bg-[#F6FBFC] p-4 text-sm" role="status">
            Moderation status: <strong>{status}</strong>. In a future release this will move
            through in review → published / needs more info / rejected.
          </p>
        ) : null}

        <p className="text-sm">
          Prefer the existing place intake?{" "}
          <Link href="/access/add-place" className="font-semibold text-[#005B7F] underline">
            Open /access/add-place
          </Link>
        </p>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  required,
}: {
  id: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        required={required}
        className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
      />
    </div>
  );
}
