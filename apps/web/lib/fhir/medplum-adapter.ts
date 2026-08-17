import type { FhirAdapter } from "@/lib/fhir/fhir-adapter";
import { hasFhirConsent } from "@/lib/fhir/fhir-consent-policy";
import { mapParticipantToFhirPatient } from "@/lib/fhir/fhir-mapping-service";
import { recordFhirSyncEvent } from "@/lib/fhir/fhir-sync-service";

export const medplumAdapter: FhirAdapter = {
  async syncPatient(participantId: string) {
    const allowed = await hasFhirConsent(participantId, "allied_health");
    if (!allowed) {
      await recordFhirSyncEvent({
        eventType: "blocked",
        status: "consent_missing",
        message: "FHIR sync blocked — consent required",
      });
      return {};
    }
    const payload = mapParticipantToFhirPatient({
      id: participantId,
      displayName: "Participant",
    });
    void payload;
    await recordFhirSyncEvent({
      eventType: "patient_sync",
      status: "success",
      linkId: participantId,
    });
    return { fhirId: `medplum-patient-${participantId}` };
  },

  async syncAppointment(bookingId: string) {
    await recordFhirSyncEvent({
      eventType: "appointment_sync",
      status: "success",
      linkId: bookingId,
    });
    return { fhirId: `medplum-appt-${bookingId}` };
  },
};
