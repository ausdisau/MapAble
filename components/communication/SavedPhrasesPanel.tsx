import type { CommunicationPassportWithRelations } from "@/lib/communication/communication-passport-service";

export function SavedPhrasesPanel({
  phrases,
}: {
  phrases: CommunicationPassportWithRelations["savedPhrases"];
}) {
  if (!phrases.length) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        No saved phrases yet.
      </p>
    );
  }

  return (
    <section aria-labelledby="phrases-heading" className="space-y-3">
      <h2 id="phrases-heading" className="font-heading text-lg font-semibold">
        Saved phrases
      </h2>
      <ul className="space-y-2">
        {phrases.map((phrase) => (
          <li key={phrase.id} className="rounded-lg border p-3">
            <p className="font-medium">{phrase.label}</p>
            <p className="text-sm">{phrase.text}</p>
            {phrase.category ? (
              <p className="text-xs text-muted-foreground">{phrase.category}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
