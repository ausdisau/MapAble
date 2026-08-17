type AssuranceView = {
  status: string;
  assurance?: {
    returnTripId?: string | null;
    assuredAt?: Date | string | null;
    notes?: string | null;
  } | null;
  returnTrip?: { id: string; scheduledStart: Date | string } | null;
};

const STATUS_LABELS: Record<string, string> = {
  not_required: "Not required",
  pending: "Pending assurance",
  assured: "Return trip assured",
  at_risk: "At risk",
  missing: "Return trip missing",
};

export function ReturnTripAssurancePanel({ data }: { data: AssuranceView }) {
  const label = STATUS_LABELS[data.status] ?? data.status;

  return (
    <section
      className="rounded-xl border border-border bg-card p-4"
      aria-labelledby="return-trip-assurance-heading"
    >
      <h2 id="return-trip-assurance-heading" className="font-semibold">
        Return trip assurance
      </h2>
      <p className="mt-2 text-sm">
        Status: <strong>{label}</strong>
      </p>
      {data.returnTrip ? (
        <p className="mt-1 text-sm text-muted-foreground">
          Linked return trip scheduled for{" "}
          {new Date(data.returnTrip.scheduledStart).toLocaleString("en-AU")}
        </p>
      ) : data.status === "pending" || data.status === "missing" ? (
        <p className="mt-2 text-sm text-amber-700" role="status">
          No return trip is linked yet. A coordinator must arrange and assure the return
          before you are left without transport home.
        </p>
      ) : null}
      {data.assurance?.notes ? (
        <p className="mt-2 text-sm text-muted-foreground">{data.assurance.notes}</p>
      ) : null}
    </section>
  );
}
