export function mapParticipantToFhirPatient(input: {
  id: string;
  displayName: string;
}) {
  return {
    resourceType: "Patient",
    identifier: [{ system: "mapable", value: input.id }],
    name: [{ text: input.displayName }],
  };
}

export function mapBookingToFhirAppointment(input: {
  id: string;
  start: string;
  end: string;
  patientRef: string;
}) {
  return {
    resourceType: "Appointment",
    identifier: [{ system: "mapable", value: input.id }],
    status: "booked",
    start: input.start,
    end: input.end,
    participant: [{ actor: { reference: `Patient/${input.patientRef}` } }],
  };
}
