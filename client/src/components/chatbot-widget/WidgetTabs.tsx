import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { WidgetTabKey } from "./types";

interface WidgetTabsProps {
  tabs: WidgetTabKey[];
  activeTab: WidgetTabKey;
  onTabChange: (tab: WidgetTabKey) => void;
  chat: React.ReactNode;
  actions: React.ReactNode;
  history: React.ReactNode;
}

const LABELS: Record<WidgetTabKey, string> = {
  chat: "Chat",
  actions: "Actions",
  history: "History",
};

export function WidgetTabs({ tabs, activeTab, onTabChange, chat, actions, history }: WidgetTabsProps) {
  const safeTab = tabs.includes(activeTab) ? activeTab : tabs[0];

  return (
    <Tabs
      value={safeTab}
      onValueChange={(v) => onTabChange(v as WidgetTabKey)}
      className="flex flex-col h-full"
    >
      <TabsList
        className="grid w-full shrink-0 rounded-none border-b border-border bg-card"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        data-testid="widget-tabs-list"
      >
        {tabs.map((t) => (
          <TabsTrigger key={t} value={t} className="min-h-[44px]" data-testid={`tab-trigger-${t}`}>
            {LABELS[t]}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.includes("chat") && (
        <TabsContent value="chat" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden" forceMount>
          {chat}
        </TabsContent>
      )}
      {tabs.includes("actions") && (
        <TabsContent value="actions" className="flex-1 overflow-auto mt-0 data-[state=inactive]:hidden" forceMount>
          {actions}
        </TabsContent>
      )}
      {tabs.includes("history") && (
        <TabsContent value="history" className="flex-1 overflow-auto mt-0 data-[state=inactive]:hidden" forceMount>
          {history}
        </TabsContent>
      )}
    </Tabs>
  );
}
