export function TelehealthConsentPanel() {
  return (
    <div className="rounded-lg border p-4 text-sm">
      <h2 className="font-semibold">Before you join</h2>
      <ul className="mt-2 list-disc pl-5 space-y-1">
        <li>Telehealth is not suitable for all emergencies — call 000 if urgent.</li>
        <li>Recording is off unless everyone consents.</li>
        <li>AI summaries require practitioner review.</li>
      </ul>
    </div>
  );
}
