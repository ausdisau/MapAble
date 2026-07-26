"use client";

import { useCallback, useState } from "react";

import type { GuidedSearchSessionFields } from "@/components/guided-search/types";
import type { SupportArea } from "@/lib/marketing/mapable-care-combined-data";
import { supportAreaToSupportTypeId } from "@/lib/marketing/mapable-care-routes";
import { SUPPORT_TYPES } from "@/lib/provider/finder/filters";

const PROMPT_SERVICE_HINTS: Record<string, string> = {
  "Find a support worker": "Personal care",
  "Book accessible transport": "Transport",
  "Understand NDIS options": "",
  "Find inclusive jobs": "Employment",
};

function serviceHintForArea(area: SupportArea): string {
  const typeId = supportAreaToSupportTypeId(area === "All" ? null : area);
  if (!typeId) return "";
  return SUPPORT_TYPES.find((type) => type.id === typeId)?.label ?? "";
}

function serviceHintForPrompt(prompt: string): string {
  return PROMPT_SERVICE_HINTS[prompt] ?? "";
}

export function useGuidedSearchLauncher(selectedArea: SupportArea = "All") {
  const [chatMode, setChatMode] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState("");
  const [dialogueSession, setDialogueSession] = useState<GuidedSearchSessionFields>({
    query: "",
    location: "",
    providerName: "",
    serviceQuery: "",
    accessQuery: "",
  });
  const [statusHint, setStatusHint] = useState("");

  const launchChat = useCallback(
    (nextQuery: string, promptLabel?: string) => {
      const trimmed = nextQuery.trim();
      if (trimmed.length < 3) {
        setStatusHint("Enter at least 3 characters to start guided search.");
        setChatMode(false);
        return false;
      }

      const serviceHint =
        (promptLabel ? serviceHintForPrompt(promptLabel) : "") ||
        serviceHintForArea(selectedArea);

      setDialogueSession({
        query: trimmed,
        location: "",
        providerName: "",
        serviceQuery: serviceHint,
        accessQuery: "",
      });
      setChatInitialMessage(trimmed);
      setChatMode(true);
      setStatusHint("");
      return true;
    },
    [selectedArea],
  );

  const resetChat = useCallback(() => {
    setChatMode(false);
    setChatInitialMessage("");
    setStatusHint("");
  }, []);

  return {
    chatMode,
    chatInitialMessage,
    dialogueSession,
    setDialogueSession,
    statusHint,
    setStatusHint,
    launchChat,
    resetChat,
  };
}
