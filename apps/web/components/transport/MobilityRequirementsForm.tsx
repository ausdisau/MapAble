"use client";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { MOBILITY_FIELD_LABELS, type MobilityRequirements } from "@/lib/transport/mobility-schema";

const BOOL_FIELDS = [
  "requiresWheelchairAccessible",
  "requiresRamp",
  "requiresHoist",
  "requiresLift",
  "requiresAccessEquipment",
  "assistanceAnimalPresent",
  "driverAssistanceRequired",
  "needsDriverAssistanceToDoor",
  "needsExtraBoardingTime",
  "canTransferFromWheelchair",
] as const satisfies readonly (keyof MobilityRequirements)[];

export function MobilityRequirementsForm({
  values,
  onChange,
  idPrefix = "mobility",
}: {
  values: MobilityRequirements;
  onChange: (next: MobilityRequirements) => void;
  idPrefix?: string;
}) {
  function toggle(key: keyof MobilityRequirements, checked: boolean) {
    onChange({ ...values, [key]: checked || undefined });
  }

  return (
    <fieldset className="space-y-3">
      <legend className="font-semibold">Mobility and access needs</legend>
      <p className="text-sm text-muted-foreground">
        These details help match you with a suitable vehicle and driver. They
        are stored with your trip request.
      </p>
      <ul className="space-y-2">
        {BOOL_FIELDS.map((key) => {
          const id = `${idPrefix}-${key}`;
          const label = MOBILITY_FIELD_LABELS[key];
          return (
            <li key={key}>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  id={id}
                  type="checkbox"
                  className="mt-1"
                  checked={values[key] === true}
                  onChange={(e) => toggle(key, e.target.checked)}
                />
                <span>{label}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <AccessibleFormField
        id={`${idPrefix}-passengerCount`}
        label="Number of passengers"
        hint="Including yourself"
      >
        <input
          id={`${idPrefix}-passengerCount`}
          type="number"
          min={1}
          max={8}
          className={formInputClass}
          value={values.passengerCount ?? ""}
          onChange={(e) =>
            onChange({
              ...values,
              passengerCount: e.target.value
                ? Number(e.target.value)
                : undefined,
            })
          }
        />
      </AccessibleFormField>
      <AccessibleFormField
        id={`${idPrefix}-mobilityAidNotes`}
        label="Additional mobility notes"
      >
        <textarea
          id={`${idPrefix}-mobilityAidNotes`}
          className={formInputClass}
          rows={3}
          value={values.mobilityAidNotes ?? ""}
          onChange={(e) =>
            onChange({
              ...values,
              mobilityAidNotes: e.target.value || undefined,
            })
          }
        />
      </AccessibleFormField>
    </fieldset>
  );
}
