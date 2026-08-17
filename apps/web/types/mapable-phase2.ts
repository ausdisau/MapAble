export type ConversationType =
  | "participant_provider"
  | "participant_support_coordinator"
  | "participant_admin"
  | "booking_thread"
  | "support_ticket_thread"
  | "organisation_admin";

export type SupportTicketCategory =
  | "booking_help"
  | "transport_issue"
  | "care_provider_issue"
  | "accessibility_issue"
  | "billing_question"
  | "profile_help"
  | "technical_issue"
  | "complaint"
  | "safeguarding_concern"
  | "other";

export type SupportTicketStatus =
  | "open"
  | "triage"
  | "waiting_on_user"
  | "waiting_on_provider"
  | "escalated"
  | "resolved"
  | "closed";

export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";

export type DocumentCategory =
  | "participant_identity"
  | "participant_plan"
  | "service_agreement"
  | "provider_insurance"
  | "provider_registration"
  | "worker_screening"
  | "booking_attachment"
  | "invoice_attachment"
  | "support_ticket_attachment"
  | "accessibility_evidence"
  | "other";

export type DocumentVisibility =
  | "private_to_participant"
  | "shared_with_provider"
  | "shared_with_plan_manager"
  | "admin_only"
  | "organisation_private";

export type FundingSourceType =
  | "ndis_self_managed"
  | "ndis_plan_managed"
  | "ndis_agency_managed"
  | "private_pay"
  | "aged_care"
  | "employer"
  | "other";

export type InvoiceStatus =
  | "draft"
  | "preflight_required"
  | "preflight_failed"
  | "approved_for_invoicing"
  | "xero_sync_pending"
  | "xero_synced"
  | "stripe_payment_pending"
  | "partially_paid"
  | "paid"
  | "voided";

export type BillingPreflightCheck =
  | "participant_exists"
  | "booking_exists"
  | "booking_completed_or_admin_approved"
  | "funding_source_exists"
  | "provider_exists"
  | "invoice_lines_present"
  | "no_sensitive_details_in_description"
  | "support_item_present_if_ndis_claimable"
  | "amounts_are_positive"
  | "currency_is_aud";

export type ProviderResponseStatus =
  | "not_sent"
  | "sent"
  | "accepted"
  | "declined"
  | "expired";

export type BookingTimelineEventType =
  | "booking_created"
  | "booking_submitted"
  | "booking_assigned"
  | "provider_accepted"
  | "provider_declined"
  | "booking_confirmed"
  | "booking_completed"
  | "invoice_drafted"
  | "support_ticket_created"
  | "message_sent";
