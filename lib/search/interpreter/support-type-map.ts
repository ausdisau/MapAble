import type { SupportTypeId } from "@/lib/provider/finder/filters";

/** Map canonical service category slug → Provider Finder support type chip. */
const SLUG_TO_SUPPORT_TYPE: Record<string, SupportTypeId> = {
  "personal-care": "personal-care",
  "accessible-transport": "transport",
  "occupational-therapy": "therapy",
  physiotherapy: "therapy",
  "support-coordination": "therapy",
};

export function supportTypeFromCategorySlug(
  slug: string | null | undefined,
): SupportTypeId | null {
  if (!slug) return null;
  return SLUG_TO_SUPPORT_TYPE[slug] ?? null;
}
