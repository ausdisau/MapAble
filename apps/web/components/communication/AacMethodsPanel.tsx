import type { CommunicationPassportWithRelations } from "@/lib/communication/communication-passport-service";

const METHOD_LABELS: Record<string, string> = {
  text_to_speech: "Text-to-speech",
  picture_board: "Picture board",
  sign_language_interpreter: "Sign language interpreter",
  written: "Written",
  gesture: "Gesture",
  device: "AAC device",
  other: "Other",
};

export function AacMethodsPanel({
  methods,
}: {
  methods: CommunicationPassportWithRelations["aacMethodPreferences"];
}) {
  if (!methods.length) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        No AAC method preferences recorded.
      </p>
    );
  }

  return (
    <section aria-labelledby="aac-heading" className="space-y-3">
      <h2 id="aac-heading" className="font-heading text-lg font-semibold">
        AAC methods
      </h2>
      <ul className="space-y-2">
        {methods.map((method) => (
          <li key={method.id} className="rounded-lg border p-3">
            <p className="font-medium">
              {method.label ?? METHOD_LABELS[method.method] ?? method.method}
              {method.preferred ? (
                <span className="ml-2 text-xs text-primary">Preferred</span>
              ) : null}
            </p>
            {method.notes ? <p className="text-sm">{method.notes}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
