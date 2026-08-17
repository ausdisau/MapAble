import type { UIMessage } from "ai";

import type {
  ClarificationChoice,
  ClarificationSlot,
  CopilotAgentStatus,
  CopilotProviderResult,
} from "@/lib/copilot/types";
import type { AppliedSearchFields } from "@/lib/search/apply-interpretation";
import type { SearchInterpretation } from "@/types/search";

export type FinderInterpretationData = {
  interpretation: SearchInterpretation;
  applied: AppliedSearchFields;
};

export type FinderAgentData = {
  sessionId: string;
  turnIndex: number;
  status: CopilotAgentStatus;
  clarificationQuestion?: string;
  clarificationSlot?: ClarificationSlot;
  suggestedChoices?: ClarificationChoice[];
  filledSlots?: Partial<Record<ClarificationSlot, boolean>>;
  providerResults?: CopilotProviderResult[];
};

export type ProviderFinderChatUIMessage = UIMessage<
  never,
  {
    finderInterpretation: FinderInterpretationData;
    finderAgent: FinderAgentData;
  }
>;
