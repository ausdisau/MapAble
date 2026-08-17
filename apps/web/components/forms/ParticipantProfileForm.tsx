"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

interface ProfileFormData {
  displayName: string;
  preferredName?: string | null;
  dateOfBirth?: string | null;
  ndisParticipantNumber?: string | null;
  homeSuburb?: string | null;
  homeState?: string | null;
  participantNotes?: string | null;
  primaryContactMethod?: string;
}

export function ParticipantProfileForm({
  initial,
}: {
  initial: ProfileFormData;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await fetch("/api/participant-profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        setLoading(false);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Could not save profile");
          return;
        }
        setStatus("Profile saved successfully.");
        router.refresh();
      }}
    >
      <AccessibleFormField id="displayName" label="Display name" required>
        <input
          id="displayName"
          className={formInputClass}
          value={form.displayName}
          onChange={(e) =>
            setForm({ ...form, displayName: e.target.value })
          }
          required
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="preferredName"
        label="Preferred name"
        hint="What you would like people to call you"
      >
        <input
          id="preferredName"
          className={formInputClass}
          value={form.preferredName ?? ""}
          onChange={(e) =>
            setForm({ ...form, preferredName: e.target.value })
          }
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="ndis"
        label="NDIS participant number"
        hint="Optional. Stored securely and not shown in full on screen."
      >
        <input
          id="ndis"
          className={formInputClass}
          autoComplete="off"
          value={form.ndisParticipantNumber ?? ""}
          onChange={(e) =>
            setForm({ ...form, ndisParticipantNumber: e.target.value })
          }
        />
      </AccessibleFormField>

      <AccessibleFormField id="homeSuburb" label="Home suburb">
        <input
          id="homeSuburb"
          className={formInputClass}
          value={form.homeSuburb ?? ""}
          onChange={(e) => setForm({ ...form, homeSuburb: e.target.value })}
        />
      </AccessibleFormField>

      <AccessibleFormField id="homeState" label="State">
        <input
          id="homeState"
          className={formInputClass}
          value={form.homeState ?? ""}
          onChange={(e) => setForm({ ...form, homeState: e.target.value })}
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="notes"
        label="Notes for you"
        hint="Visible only to you unless you share via consent"
      >
        <textarea
          id="notes"
          className={formInputClass}
          rows={4}
          value={form.participantNotes ?? ""}
          onChange={(e) =>
            setForm({ ...form, participantNotes: e.target.value })
          }
        />
      </AccessibleFormField>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {status ? (
        <p role="status" className="text-sm text-green-800">
          {status}
        </p>
      ) : null}

      <Button type="submit" variant="default" size="default" loading={loading}>
        Save profile
      </Button>
    </form>
  );
}
