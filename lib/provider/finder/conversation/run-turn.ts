import {
  applyInterpretationToFields,
  type AppliedSearchFields,
} from "@/lib/search/apply-interpretation";
import { interpretSearchQuery } from "@/lib/search/interpreter";
import type { SearchInterpretation } from "@/types/search";

import { formatFinderReplyFromInterpretation } from "./format-reply";

export type ProviderFinderConversationTurn = {
  interpretation: SearchInterpretation;
  applied: AppliedSearchFields;
  replyText: string;
};

export async function runProviderFinderConversationTurn(
  userText: string,
  currentFields?: {
    query: string;
    location: string;
    providerName: string;
    serviceQuery: string;
    accessQuery: string;
  },
): Promise<ProviderFinderConversationTurn> {
  const trimmed = userText.trim();
  const interpretation = await interpretSearchQuery(trimmed || " ");

  const applied = applyInterpretationToFields(interpretation, {
    query: currentFields?.query ?? "",
    location: currentFields?.location ?? "",
    providerName: currentFields?.providerName ?? "",
    serviceQuery: currentFields?.serviceQuery ?? "",
    accessQuery: currentFields?.accessQuery ?? "",
  });

  return {
    interpretation,
    applied,
    replyText: formatFinderReplyFromInterpretation(interpretation),
  };
}
