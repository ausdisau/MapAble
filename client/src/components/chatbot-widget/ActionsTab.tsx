import { Card } from "@/components/ui/card";
import { HeartHandshake, Bus, Briefcase, HelpCircle, Phone } from "lucide-react";
import type { ActionKey, FeatureFlags } from "./types";

interface ActionDef {
  key: ActionKey;
  title: string;
  description: string;
  icon: typeof HeartHandshake;
  requiresFlag?: keyof FeatureFlags;
}

const ACTIONS: ActionDef[] = [
  {
    key: "create_support_request",
    title: "Create support request",
    description: "Tell us what kind of help you need and we'll match a worker.",
    icon: HeartHandshake,
  },
  {
    key: "book_transport",
    title: "Book accessible transport",
    description: "Arrange wheelchair accessible transport for your next trip.",
    icon: Bus,
  },
  {
    key: "create_job_post",
    title: "Create a job post",
    description: "Post a disability support role for workers to apply.",
    icon: Briefcase,
    requiresFlag: "matchingEnabled",
  },
  {
    key: "ask_ndis_funding",
    title: "Ask about NDIS funding",
    description: "Questions about budgets, claims, or your plan.",
    icon: HelpCircle,
  },
  {
    key: "contact_support",
    title: "Contact support",
    description: "Talk to a real person from the MapAble team.",
    icon: Phone,
  },
];

interface ActionsTabProps {
  onActionSelect: (action: ActionKey) => void;
  featureFlags: FeatureFlags;
}

export function ActionsTab({ onActionSelect, featureFlags }: ActionsTabProps) {
  const visible = ACTIONS.filter((a) => !a.requiresFlag || featureFlags[a.requiresFlag]);

  return (
    <div className="p-4 space-y-3" data-testid="widget-actions-tab">
      <p className="text-sm text-muted-foreground" id="widget-actions-help">
        Pick a quick action to get started.
      </p>
      <div className="space-y-2" role="list" aria-describedby="widget-actions-help">
        {visible.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.key}
              role="listitem"
              className="hover-elevate active-elevate-2 cursor-pointer"
              data-testid={`card-action-${action.key}`}
            >
              <button
                type="button"
                onClick={() => onActionSelect(action.key)}
                className="w-full text-left p-4 flex items-start gap-3 min-h-[64px] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B6EB5]/50"
                data-testid={`button-action-${action.key}`}
              >
                <div className="w-10 h-10 rounded-full bg-[#1B6EB5]/10 text-[#1B6EB5] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{action.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{action.description}</div>
                </div>
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
