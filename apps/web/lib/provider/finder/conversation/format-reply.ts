import type { SearchInterpretation } from "@/types/search";

export function formatFinderReplyFromInterpretation(
  interpretation: SearchInterpretation,
): string {
  const { filters, parsed, confidence, serviceCategorySlug } = interpretation;

  if (!parsed) {
    return `I kept your search as “${interpretation.sourceQuery}”. Add a location or service (for example “occupational therapy in Parramatta”) and I’ll refine the filters.`;
  }

  const parts: string[] = [];

  if (filters.service || filters.q) {
    parts.push(filters.service || filters.q);
  }
  if (filters.location) {
    parts.push(`near ${filters.location}`);
  }
  if (filters.access) {
    parts.push(`with ${filters.access}`);
  }
  if (filters.provider) {
    parts.push(`provider ${filters.provider}`);
  }

  const summary =
    parts.length > 0
      ? parts.join(", ")
      : interpretation.sourceQuery;

  let reply = `I’ll look for providers matching ${summary}.`;

  if (serviceCategorySlug) {
    reply += ` I mapped that to the ${serviceCategorySlug.replace(/-/g, " ")} category.`;
  }

  if (confidence < 0.6) {
    reply +=
      " The match is tentative — tweak the filters on the left if something looks off.";
  } else {
    reply += " Check the results below and adjust filters anytime.";
  }

  return reply;
}
