import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import type { ChatSession } from "@shared/schema";
import { ChatbotLauncher } from "./ChatbotLauncher";
import { ChatbotPanel } from "./ChatbotPanel";
import { ChatTab } from "./ChatTab";
import { ActionsTab } from "./ActionsTab";
import { HistoryTab } from "./HistoryTab";
import { useWidgetState } from "./useWidgetState";
import { useWidgetConfig } from "./useWidgetConfig";
import type { ActionKey, PendingAction, RecentConversation, SavedDraft } from "./types";

interface ChatbotWidgetProps {
  savedDrafts?: SavedDraft[];
  pendingActions?: PendingAction[];
}

const ACTION_SEEDS: Record<ActionKey, string> = {
  create_support_request: "I'd like to create a support request. Can you help me describe what I need?",
  book_transport: "I'd like to book accessible transport.",
  create_job_post: "I want to create a job post for a support worker role.",
  ask_ndis_funding: "Can you help me understand my NDIS funding?",
  contact_support: "I'd like to talk to a real person from the MapAble team.",
};

export function ChatbotWidget({ savedDrafts = [], pendingActions = [] }: ChatbotWidgetProps) {
  const { isAuthenticated } = useAuth();
  const { config } = useWidgetConfig();
  const { open, setOpen, toggle, activeTab, setActiveTab, activeSessionId, setActiveSessionId } = useWidgetState(
    config.defaultTab,
  );
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const sessionsQuery = useQuery<ChatSession[]>({
    queryKey: ["/api/chat/sessions"],
    enabled: isAuthenticated && open,
  });

  const recentConversations: RecentConversation[] = (sessionsQuery.data || []).slice(0, 10).map((s) => ({
    id: s.id,
    title: s.title || "New conversation",
    updatedAt: s.startedAt || new Date().toISOString(),
  }));

  const handleActionSelect = useCallback(
    (action: ActionKey) => {
      if (action === "book_transport") {
        setLocation("/transport");
        setOpen(false);
        return;
      }
      if (action === "create_job_post") {
        setLocation("/jobs");
        setOpen(false);
        return;
      }
      setSeedMessage(ACTION_SEEDS[action]);
      setActiveTab("chat");
    },
    [setActiveTab, setLocation, setOpen],
  );

  const handleOpenConversation = useCallback(
    (id: string) => {
      setActiveSessionId(id);
      setActiveTab("chat");
    },
    [setActiveSessionId, setActiveTab],
  );

  const handleOpenDraft = useCallback(
    (id: string) => {
      const d = savedDrafts.find((x) => x.id === id);
      if (d) {
        setSeedMessage(d.body);
        setActiveTab("chat");
      }
    },
    [savedDrafts, setActiveTab],
  );

  const handleOpenPendingAction = useCallback(
    (id: string) => {
      const p = pendingActions.find((x) => x.id === id);
      if (p) {
        setSeedMessage(`Following up on: ${p.label}`);
        setActiveTab("chat");
      }
    },
    [pendingActions, setActiveTab],
  );

  if (!isAuthenticated || !config.enabled) return null;

  return (
    <>
      <ChatbotLauncher open={open} onClick={toggle} label={config.launcherLabel} />
      <ChatbotPanel
        open={open}
        onOpenChange={setOpen}
        title={config.panelTitle}
        subtitle={config.panelSubtitle}
        tabs={config.tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        chat={
          <ChatTab
            activeSessionId={activeSessionId}
            setActiveSessionId={setActiveSessionId}
            featureFlags={config.featureFlags}
            seedMessage={seedMessage}
            onSeedConsumed={() => setSeedMessage(null)}
          />
        }
        actions={<ActionsTab onActionSelect={handleActionSelect} featureFlags={config.featureFlags} />}
        history={
          <HistoryTab
            recentConversations={recentConversations}
            savedDrafts={savedDrafts}
            pendingActions={pendingActions}
            onOpenConversation={handleOpenConversation}
            onOpenDraft={handleOpenDraft}
            onOpenPendingAction={handleOpenPendingAction}
          />
        }
      />
    </>
  );
}

export default ChatbotWidget;
