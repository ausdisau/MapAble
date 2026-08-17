"use client";

export function AppointmentSlotPicker({
  slotIds,
  onSelect,
}: {
  slotIds: string[];
  onSelect: (slotId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a time slot">
      {slotIds.map((id) => (
        <button
          key={id}
          type="button"
          className="rounded-md border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          onClick={() => onSelect(id)}
        >
          Slot {id.slice(0, 8)}
        </button>
      ))}
    </div>
  );
}
