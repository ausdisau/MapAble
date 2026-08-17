export type FhirProvider = "medplum" | "hapi" | "disabled";

export function getFhirProvider(): FhirProvider {
  const v = process.env.FHIR_PROVIDER ?? "disabled";
  if (v === "medplum" || v === "hapi") return v;
  return "disabled";
}

export interface FhirAdapter {
  syncPatient(participantId: string): Promise<{ fhirId?: string }>;
  syncAppointment(bookingId: string): Promise<{ fhirId?: string }>;
}
