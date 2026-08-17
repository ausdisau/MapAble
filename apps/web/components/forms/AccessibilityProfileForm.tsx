"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AccessibilityPreferenceCard } from "@/components/accessibility/AccessibilityPreferenceCard";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import type { DigitalPreferences, TransportRequirements } from "@/types/mapable";

const MOBILITY_OPTIONS = [
  "manual_wheelchair",
  "power_wheelchair",
  "mobility_scooter",
  "walker",
  "cane",
  "assistance_animal",
  "none",
  "other",
] as const;

const COMM_OPTIONS = [
  "plain_language",
  "sms",
  "email",
  "phone",
  "aac",
  "auslan",
  "support_person",
  "written_only",
] as const;

export function AccessibilityProfileForm({
  initial,
}: {
  initial: {
    mobilityNeeds: string[];
    communicationPreferences: string[];
    transportRequirements: TransportRequirements;
    digitalPreferences: DigitalPreferences;
  };
}) {
  const router = useRouter();
  const [mobility, setMobility] = useState<string[]>(initial.mobilityNeeds);
  const [communication, setCommunication] = useState<string[]>(
    initial.communicationPreferences
  );
  const [transport, setTransport] = useState(initial.transportRequirements);
  const [digital, setDigital] = useState(initial.digitalPreferences);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(
      list.includes(value)
        ? list.filter((x) => x !== value)
        : [...list, value]
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const res = await fetch("/api/accessibility-profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobilityNeeds: mobility,
            communicationPreferences: communication,
            transportRequirements: transport,
            digitalPreferences: digital,
            sensoryPreferences: {},
            cognitivePreferences: {},
            shareWithProviders: {},
          }),
        });
        setLoading(false);
        if (res.ok) {
          setStatus("Accessibility preferences saved.");
          router.refresh();
        } else {
          setStatus("Could not save. Please try again.");
        }
      }}
    >
      <AccessibilityPreferenceCard
        title="Mobility"
        description="Equipment and mobility aids you use"
      >
        <fieldset>
          <legend className="sr-only">Mobility aids</legend>
          <div className="flex flex-wrap gap-2">
            {MOBILITY_OPTIONS.map((opt) => (
              <label key={opt} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border px-3">
                <input
                  type="checkbox"
                  checked={mobility.includes(opt)}
                  onChange={() => toggle(mobility, opt, setMobility)}
                />
                <span className="text-sm">{opt.replace(/_/g, " ")}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </AccessibilityPreferenceCard>

      <AccessibilityPreferenceCard
        title="Communication"
        description="How you prefer to receive information"
      >
        <div className="flex flex-wrap gap-2">
          {COMM_OPTIONS.map((opt) => (
            <label key={opt} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border px-3">
              <input
                type="checkbox"
                checked={communication.includes(opt)}
                onChange={() => toggle(communication, opt, setCommunication)}
              />
              <span className="text-sm">{opt.replace(/_/g, " ")}</span>
            </label>
          ))}
        </div>
      </AccessibilityPreferenceCard>

      <AccessibilityPreferenceCard
        title="Transport access"
        description="Requirements for accessible transport bookings"
      >
        <div className="space-y-3">
          {[
            ["requiresWheelchairAccessibleVehicle", "Wheelchair accessible vehicle"],
            ["canTransferFromWheelchair", "Can transfer from wheelchair"],
            ["requiresRamp", "Requires ramp"],
            ["assistanceAnimalPresent", "Assistance animal"],
            ["needsDriverAssistanceToDoor", "Driver assistance to door"],
            ["needsExtraBoardingTime", "Extra boarding time"],
          ].map(([key, label]) => (
            <label key={key} className="flex min-h-10 items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(transport[key as keyof TransportRequirements])}
                onChange={(e) =>
                  setTransport({ ...transport, [key]: e.target.checked })
                }
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
          <AccessibleFormField id="pickupNotes" label="Pickup notes">
            <textarea
              id="pickupNotes"
              className={formInputClass}
              rows={2}
              value={transport.pickupNotes ?? ""}
              onChange={(e) =>
                setTransport({ ...transport, pickupNotes: e.target.value })
              }
            />
          </AccessibleFormField>
        </div>
      </AccessibilityPreferenceCard>

      <AccessibilityPreferenceCard
        title="Digital interface"
        description="How MapAble should present information to you"
      >
        <div className="space-y-2">
          {[
            ["largeText", "Large text"],
            ["highContrast", "High contrast"],
            ["reducedMotion", "Reduced motion"],
            ["screenReaderUser", "Screen reader user"],
            ["simpleLanguageMode", "Simple language mode"],
          ].map(([key, label]) => (
            <label key={key} className="flex min-h-10 items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(digital[key as keyof DigitalPreferences])}
                onChange={(e) =>
                  setDigital({ ...digital, [key]: e.target.checked })
                }
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </AccessibilityPreferenceCard>

      {status ? (
        <p role="status" className="text-sm">
          {status}
        </p>
      ) : null}

      <Button type="submit" variant="default" size="default" loading={loading}>
        Save accessibility preferences
      </Button>
    </form>
  );
}
