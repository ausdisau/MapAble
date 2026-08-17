export function BookingConfirmationPanel({
  confirmed,
  externalReference,
}: {
  confirmed: boolean;
  externalReference?: string;
}) {
  if (!confirmed) {
    return <p className="text-sm">Select a slot to confirm your appointment.</p>;
  }
  return (
    <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm dark:bg-green-950">
      <p className="font-medium">Appointment confirmed</p>
      {externalReference ? (
        <p className="mt-1 text-muted-foreground">
          Reference: {externalReference}
        </p>
      ) : null}
      <p className="mt-2 text-xs">
        MapAble remains the source of truth for billing and telehealth.
      </p>
    </div>
  );
}
