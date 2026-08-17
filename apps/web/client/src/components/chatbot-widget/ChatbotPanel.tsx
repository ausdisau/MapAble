import { useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { WidgetTabs } from "./WidgetTabs";
import type { WidgetTabKey } from "./types";

interface ChatbotPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  tabs: WidgetTabKey[];
  activeTab: WidgetTabKey;
  onTabChange: (tab: WidgetTabKey) => void;
  chat: React.ReactNode;
  actions: React.ReactNode;
  history: React.ReactNode;
}

export function ChatbotPanel({
  open,
  onOpenChange,
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  chat,
  actions,
  history,
}: ChatbotPanelProps) {
  const isMobile = useIsMobile();
  const launcherRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      launcherRef.current = document.querySelector(
        '[data-testid="button-chatbot-launcher"]',
      ) as HTMLElement | null;
    } else if (launcherRef.current) {
      launcherRef.current.focus();
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "h-[85vh] w-full p-0 flex flex-col gap-0 sm:max-w-full"
            : "w-full p-0 flex flex-col gap-0 sm:max-w-md"
        }
        data-testid="chatbot-panel"
      >
        <SheetHeader className="px-4 py-3 border-b border-border space-y-0.5 text-left">
          <SheetTitle className="text-base" data-testid="text-widget-title">
            {title}
          </SheetTitle>
          <SheetDescription className="text-xs">{subtitle}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 min-h-0">
          <WidgetTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            chat={chat}
            actions={actions}
            history={history}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
