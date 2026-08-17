const ALLOWED_TYPES = [
  "help_articles",
  "easy_read_pages",
  "policy_pages",
  "service_categories",
  "access_feature_definitions",
  "onboarding_copy",
] as const;

export type ContentSyncType = (typeof ALLOWED_TYPES)[number];

export function isAllowedContentType(type: string): type is ContentSyncType {
  return ALLOWED_TYPES.includes(type as ContentSyncType);
}

export function sanitizeContentHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/javascript:/gi, "");
}
