export type CareRequestType =
  | "personal_care"
  | "domestic_assistance"
  | "community_access"
  | "appointment_support"
  | "employment_support"
  | "meal_preparation"
  | "therapy_assistance"
  | "skill_building"
  | "overnight_support"
  | "other";

export type CareRequestStatus =
  | "draft"
  | "submitted"
  | "awaiting_admin_review"
  | "awaiting_provider_response"
  | "matched"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";

export type CareShiftStatus =
  | "scheduled"
  | "worker_assigned"
  | "confirmed"
  | "worker_en_route"
  | "checked_in"
  | "in_progress"
  | "checked_out"
  | "awaiting_participant_approval"
  | "approved"
  | "completed"
  | "cancelled"
  | "disputed";

export type TransportBookingStatus =
  | "draft"
  | "requested"
  | "awaiting_operator_response"
  | "operator_accepted"
  | "driver_assigned"
  | "vehicle_assigned"
  | "confirmed"
  | "driver_en_route"
  | "arrived_for_pickup"
  | "participant_on_board"
  | "in_transit"
  | "arrived_at_destination"
  | "completed"
  | "cancelled"
  | "disputed";

export type CalendarEventType =
  | "care_request"
  | "care_shift"
  | "transport_booking"
  | "job_application"
  | "job_interview"
  | "support_ticket_followup"
  | "admin_task";
