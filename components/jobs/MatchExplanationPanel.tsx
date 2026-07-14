import type { JobMatchExplanation } from "@prisma/client";

type RequirementItem = {
  requirementId?: string;
  label: string;
  status: string;
  note: string;
};

type AdjustmentItem = {
  label: string;
  status: string;
  source: string;
  note: string;
};

function asRequirementItems(value: unknown): RequirementItem[] {
  if (!Array.isArray(value)) return [];
  return value as RequirementItem[];
}

function asAdjustmentItems(value: unknown): AdjustmentItem[] {
  if (!Array.isArray(value)) return [];
  return value as AdjustmentItem[];
}

export function MatchExplanationPanel({
  match,
}: {
  match: JobMatchExplanation & {
    job?: { title: string; employerOrganisation?: { name: string } };
  };
}) {
  const matched = asRequirementItems(match.requirementsMatched);
  const notMatched = asRequirementItems(match.requirementsNotMatched);
  const adjustmentsAvailable = asAdjustmentItems(match.adjustmentsAvailable);
  const adjustmentsUnknown = asAdjustmentItems(match.adjustmentsUnknown);
  const locationAccess =
    typeof match.locationAccess === "object" && match.locationAccess !== null
      ? (match.locationAccess as { accessible?: boolean | null; notes?: string[] })
      : {};

  return (
    <section aria-labelledby="match-explanation-heading" className="space-y-4 rounded-xl border p-4">
      <header>
        <h2 id="match-explanation-heading" className="font-heading text-lg font-semibold">
          Match explanation
          {match.job ? ` — ${match.job.title}` : ""}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{match.explanationSummary}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          This is an explanation only. No ranking, employability score, or automatic rejection
          is applied.
        </p>
      </header>

      <div>
        <h3 className="font-medium">Requirements matched</h3>
        {matched.length === 0 ? (
          <p className="text-sm text-muted-foreground">None identified from your profile.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {matched.map((item) => (
              <li key={item.requirementId ?? item.label}>
                <strong>{item.label}</strong> — {item.note}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="font-medium">Requirements needing your review</h3>
        {notMatched.length === 0 ? (
          <p className="text-sm text-muted-foreground">None flagged.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {notMatched.map((item) => (
              <li key={item.requirementId ?? item.label}>
                <strong>{item.label}</strong> ({item.status}) — {item.note}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="font-medium">Adjustments available</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {adjustmentsAvailable.map((item) => (
              <li key={item.label}>
                {item.label} ({item.source}) — {item.note}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium">Adjustments unknown</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {adjustmentsUnknown.map((item) => (
              <li key={item.label}>
                {item.label} ({item.source}) — {item.note}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="font-medium">Location access</h3>
        <p className="text-sm">
          {locationAccess.accessible === true
            ? "Verified accessibility evidence on file."
            : locationAccess.accessible === false
              ? "Accessibility concerns noted."
              : "Unknown — review workplace evidence."}
        </p>
        {locationAccess.notes?.map((note) => (
          <p key={note} className="text-sm text-muted-foreground">
            {note}
          </p>
        ))}
      </div>

      {(match.transportDependency || match.supportDependency) && (
        <div>
          <h3 className="font-medium">Dependencies noted in your profile</h3>
          <ul className="text-sm">
            {match.transportDependency ? <li>Transport dependency</li> : null}
            {match.supportDependency ? <li>Support dependency</li> : null}
          </ul>
        </div>
      )}

      {match.applicationDecisionRequired ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm" role="status">
          Application decision required — review requirements and disclosure before applying.
        </p>
      ) : null}
    </section>
  );
}
