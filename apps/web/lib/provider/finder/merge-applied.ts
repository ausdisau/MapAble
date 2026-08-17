import type { AppliedSearchFields } from "@/lib/search/apply-interpretation";

/** Merge a new interpretation onto prior finder fields (multi-turn). */
export function mergeAppliedFields(
  prior: AppliedSearchFields | undefined,
  next: AppliedSearchFields,
): AppliedSearchFields {
  if (!prior) return next;

  const accessNeedIds = [
    ...new Set([...prior.accessNeedIds, ...next.accessNeedIds]),
  ];

  return {
    query: next.query.trim() ? next.query : prior.query,
    location: next.location.trim() ? next.location : prior.location,
    providerName: next.providerName.trim() ? next.providerName : prior.providerName,
    serviceQuery: next.serviceQuery.trim() ? next.serviceQuery : prior.serviceQuery,
    accessQuery: next.accessQuery.trim() ? next.accessQuery : prior.accessQuery,
    supportType: next.supportType ?? prior.supportType,
    accessNeedIds,
  };
}
