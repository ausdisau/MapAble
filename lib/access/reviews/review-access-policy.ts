import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";

export function canCreateReview(user: CurrentUser | null): boolean {
  return Boolean(user);
}

export function canEditReview(
  user: CurrentUser | null,
  reviewerProfileId: string
): boolean {
  if (!user) return false;
  if (isAdminRole(user.primaryRole)) return true;
  return user.id === reviewerProfileId;
}

export function canDeleteReview(
  user: CurrentUser | null,
  reviewerProfileId: string
): boolean {
  return canEditReview(user, reviewerProfileId);
}

export function publicReviewerDisplayName(params: {
  mode: string;
  userName: string;
}): string {
  if (params.mode === "anonymous_public") return "Community member";
  if (params.mode === "first_name") {
    return params.userName.split(/\s+/)[0] ?? "Community member";
  }
  return params.userName;
}
