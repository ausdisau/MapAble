import { getFhirProvider } from "@/lib/fhir/fhir-adapter";

export function FhirConnectionPanel() {
  const provider = getFhirProvider();
  return (
    <section className="rounded-lg border p-4">
      <h2 className="font-semibold">FHIR sidecar</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Provider: {provider}. MapAble remains source of truth for bookings and
        billing.
      </p>
    </section>
  );
}
