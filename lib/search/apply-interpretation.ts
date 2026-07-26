import type { SupportTypeId } from "@/lib/provider/finder/filters";
import type { SearchInterpretation } from "@/types/search";

import { supportTypeFromCategorySlug } from "./interpreter/support-type-map";

export type AppliedSearchFields = {
  query: string;
  location: string;
  providerName: string;
  serviceQuery: string;
  accessQuery: string;
  supportType: SupportTypeId | null;
  accessNeedIds: string[];
};

export function applyInterpretationToFields(
  interpretation: SearchInterpretation,
  current: {
    query: string;
    location: string;
    providerName: string;
    serviceQuery: string;
    accessQuery: string;
  },
): AppliedSearchFields {
  const filters = interpretation.filters ?? {};

  const query =
    filters.q ||
    (interpretation.parsed ? "" : current.query) ||
    interpretation.sourceQuery;
  const location = filters.location || current.location;
  const providerName = filters.provider || current.providerName;
  const serviceQuery =
    filters.service ||
    (interpretation.serviceCategorySlug
      ? interpretation.serviceCategorySlug.replace(/-/g, " ")
      : "") ||
    current.serviceQuery;
  const accessQuery = filters.access || current.accessQuery;

  const supportType = supportTypeFromCategorySlug(
    interpretation.serviceCategorySlug,
  );

  return {
    query,
    location,
    providerName,
    serviceQuery,
    accessQuery,
    supportType,
    accessNeedIds: interpretation.accessNeedIds ?? [],
  };
}

export function buildFinderSearchParams(
  fields: AppliedSearchFields,
): URLSearchParams {
  const params = new URLSearchParams();
  if (fields.query.trim()) params.set("q", fields.query.trim());
  if (fields.location.trim()) params.set("location", fields.location.trim());
  if (fields.accessQuery.trim())
    params.set("access", fields.accessQuery.trim());
  if (fields.serviceQuery.trim())
    params.set("service", fields.serviceQuery.trim());
  if (fields.providerName.trim())
    params.set("provider", fields.providerName.trim());
  if (fields.supportType && fields.supportType !== "all") {
    params.set("supportType", fields.supportType);
  }
  if (fields.accessNeedIds.length > 0) {
    params.set("accessNeeds", fields.accessNeedIds.join(","));
  }
  return params;
}
