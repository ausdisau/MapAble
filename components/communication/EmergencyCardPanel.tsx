import type { EmergencyCommunicationCard } from "@prisma/client";

export function EmergencyCardPanel({
  card,
}: {
  card: EmergencyCommunicationCard | null | undefined;
}) {
  if (!card) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        No emergency communication card on file.
      </p>
    );
  }

  return (
    <section
      aria-labelledby="emergency-card-heading"
      className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4"
    >
      <h2 id="emergency-card-heading" className="font-heading text-lg font-semibold">
        Emergency communication card
      </h2>
      {card.emergencyContactName ? (
        <p className="text-sm">
          Contact: {card.emergencyContactName}
          {card.emergencyContactPhone ? ` — ${card.emergencyContactPhone}` : ""}
        </p>
      ) : null}
      {card.communicationNeeds ? (
        <div>
          <h3 className="font-medium">Communication needs</h3>
          <p className="text-sm">{card.communicationNeeds}</p>
        </div>
      ) : null}
      {card.accessInstructions ? (
        <div>
          <h3 className="font-medium">Access instructions</h3>
          <p className="text-sm">{card.accessInstructions}</p>
        </div>
      ) : null}
      {card.lastReviewedAt ? (
        <p className="text-xs text-muted-foreground">
          Last reviewed: {card.lastReviewedAt.toLocaleDateString("en-AU")}
        </p>
      ) : null}
    </section>
  );
}
