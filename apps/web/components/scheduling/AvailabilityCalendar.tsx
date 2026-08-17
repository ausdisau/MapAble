export function AvailabilityCalendar({
  slots,
}: {
  slots: Array<{ startsAt: Date; endsAt: Date }>;
}) {
  return (
    <ul className="space-y-2 text-sm" aria-label="Available appointment slots">
      {slots.map((s, i) => (
        <li key={i} className="rounded border px-3 py-2">
          {s.startsAt.toLocaleString()} – {s.endsAt.toLocaleTimeString()}
        </li>
      ))}
    </ul>
  );
}
