import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";

export type IndoorPermission =
  | "venue.floorPlan.viewPublic"
  | "venue.floorPlan.create"
  | "venue.floorPlan.editDraft"
  | "venue.floorPlan.submitReview"
  | "venue.floorPlan.review"
  | "venue.floorPlan.publish"
  | "venue.floorPlan.archive"
  | "venue.floorPlan.viewRestricted"
  | "venue.verification.create"
  | "venue.verification.approve"
  | "venue.correction.submit"
  | "venue.correction.moderate"
  | "venue.status.report"
  | "venue.status.verify"
  | "venue.accreditation.assess"
  | "venue.accreditation.approve"
  | "participant.profile.manage"
  | "participant.visitPlan.manage"
  | "participant.visitPlan.share"
  | "partner.api.manage";

export function canViewPublicFloorPlan(_user: CurrentUser | null): boolean {
  return true;
}

export function canCreateFloorPlanDraft(user: CurrentUser | null): boolean {
  if (!user) return false;
  return (
    isAdminRole(user.primaryRole) ||
    hasPermission(user.primaryRole, "accessibility_map:manage") ||
    hasPermission(user.primaryRole, "assessor:portal")
  );
}

export function canEditFloorPlanDraft(user: CurrentUser | null): boolean {
  return canCreateFloorPlanDraft(user);
}

export function canSubmitFloorPlanReview(user: CurrentUser | null): boolean {
  return canCreateFloorPlanDraft(user);
}

export function canReviewFloorPlan(user: CurrentUser | null): boolean {
  if (!user) return false;
  return (
    isAdminRole(user.primaryRole) ||
    hasPermission(user.primaryRole, "assessor:portal") ||
    hasPermission(user.primaryRole, "verification:manage:any")
  );
}

export function canPublishFloorPlan(user: CurrentUser | null): boolean {
  if (!user) return false;
  return (
    isAdminRole(user.primaryRole) ||
    hasPermission(user.primaryRole, "verification:manage:any")
  );
}

export function canSubmitCorrection(_user: CurrentUser | null): boolean {
  return true;
}

export function canModerateCorrection(user: CurrentUser | null): boolean {
  return canReviewFloorPlan(user);
}

export function canReportStatus(_user: CurrentUser | null): boolean {
  return true;
}

export function canVerifyStatus(user: CurrentUser | null): boolean {
  return canReviewFloorPlan(user);
}

export function canManageVisitPlan(user: CurrentUser | null): boolean {
  return Boolean(user);
}

export function canManagePartnerApi(user: CurrentUser | null): boolean {
  if (!user) return false;
  return (
    isAdminRole(user.primaryRole) ||
    hasPermission(user.primaryRole, "partner_api:manage")
  );
}

export function assertIndoorPermission(
  user: CurrentUser | null,
  check: (u: CurrentUser | null) => boolean,
): boolean {
  return check(user);
}
