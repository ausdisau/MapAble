import type { MapAbleUserRole } from "@prisma/client";

const APPROVED_VIEWS = [
  "analytics_provider_booking_summary",
  "analytics_unmet_need_region_summary",
  "analytics_quality_trends_deidentified",
  "analytics_invoice_status_summary",
  "analytics_worker_compliance_summary",
] as const;

export function canAccessAnalyticsView(
  role: MapAbleUserRole,
  viewName: string,
  organisationId?: string
): boolean {
  if (!APPROVED_VIEWS.includes(viewName as (typeof APPROVED_VIEWS)[number])) {
    return false;
  }
  if (role === "mapable_admin") return true;
  if (role === "provider_admin" && organisationId) return true;
  if (role === "plan_manager" && viewName.includes("deidentified")) return true;
  return false;
}
