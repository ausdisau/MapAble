export type WidgetTabKey = "chat" | "actions" | "history";

export interface FeatureFlags {
  voiceEnabled: boolean;
  nlpEnabled: boolean;
  matchingEnabled: boolean;
  contractsEnabled: boolean;
  attestationsEnabled: boolean;
}

export interface ServiceEndpoints {
  nlp: string;
  voice: string;
  matching: string;
  contracts: string;
  attestations: string;
  chat: string;
  sessions: string;
  widgetConfig: string;
}

export interface WidgetConfig {
  enabled: boolean;
  tabs: WidgetTabKey[];
  defaultTab: WidgetTabKey;
  featureFlags: FeatureFlags;
  endpoints: ServiceEndpoints;
  launcherLabel: string;
  panelTitle: string;
  panelSubtitle: string;
}

export interface RecentConversation {
  id: string;
  title: string;
  updatedAt: string | Date;
}

export interface SavedDraft {
  id: string;
  title: string;
  body: string;
  updatedAt: string | Date;
}

export interface PendingAction {
  id: string;
  label: string;
  description?: string;
  updatedAt: string | Date;
}

export type ActionKey =
  | "create_support_request"
  | "book_transport"
  | "create_job_post"
  | "ask_ndis_funding"
  | "contact_support"
  | "update_profile"
  | "edit_barrier_report";

export const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  enabled: true,
  tabs: ["chat", "actions", "history"],
  defaultTab: "chat",
  featureFlags: {
    voiceEnabled: true,
    nlpEnabled: true,
    matchingEnabled: false,
    contractsEnabled: false,
    attestationsEnabled: false,
  },
  endpoints: {
    nlp: "/api/widget/nlp",
    voice: "/api/widget/voice",
    matching: "/api/widget/matching",
    contracts: "/api/widget/contracts",
    attestations: "/api/widget/attestations",
    chat: "/api/chat/send",
    sessions: "/api/chat/sessions",
    widgetConfig: "/api/widget-config",
  },
  launcherLabel: "Open MapAble assistant",
  panelTitle: "MapAble Assistant",
  panelSubtitle: "Chat, actions, and history",
};
