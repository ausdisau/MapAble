import type { FhirAdapter } from "@/lib/fhir/fhir-adapter";
import { medplumAdapter } from "@/lib/fhir/medplum-adapter";

/** HAPI adapter — same contract; base URL from HAPI_FHIR_BASE_URL when live. */
export const hapiFhirAdapter: FhirAdapter = {
  syncPatient: (id) => medplumAdapter.syncPatient(id),
  syncAppointment: (id) => medplumAdapter.syncAppointment(id),
};
