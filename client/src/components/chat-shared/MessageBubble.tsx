import { Bot, User, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QUICK_ACTION_CONFIG, CONFIDENCE_CONFIG } from "./quick-actions";

export interface DisplayMessage {
  id: string;
  role: string;
  content: string;
  quickActions?: string[] | null;
  confidence?: string | null;
}

interface MessageBubbleProps {
  message: DisplayMessage;
  onQuickAction: (action: string) => void;
  compact?: boolean;
}

export function ConfidenceBadge({ confidence }: { confidence: string }) {
  const config = CONFIDENCE_CONFIG[confidence] || CONFIDENCE_CONFIG.general;
  return (
    <Badge variant={config.variant} className="text-[10px] gap-1" data-testid={`badge-confidence-${confidence}`}>
      <Shield className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

export function MessageBubble({ message, onQuickAction, compact }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const avatarSize = compact ? "w-7 h-7" : "w-8 h-8";
  const iconSize = compact ? "w-3.5 h-3.5" : "w-4 h-4";
  const bubblePad = compact ? "px-3 py-2 text-sm" : "px-4 py-3 text-sm";
  const bubbleMax = compact ? "max-w-[85%]" : "max-w-[85%] md:max-w-[75%]";

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`} data-testid={`message-bubble-${message.id}`}>
      <div
        className={`${avatarSize} rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-[#1B6EB5] text-white" : "bg-[#2EAA6E]/15 text-[#2EAA6E] dark:bg-[#2EAA6E]/25"
        }`}
        aria-hidden="true"
      >
        {isUser ? <User className={iconSize} /> : <Bot className={iconSize} />}
      </div>
      <div className={`flex flex-col gap-2 ${bubbleMax} ${isUser ? "items-end" : ""}`}>
        <div
          className={`rounded-2xl ${bubblePad} leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-[#1B6EB5] text-white rounded-br-md"
              : "bg-card border border-border rounded-bl-md"
          }`}
          data-testid={`text-message-content-${message.id}`}
        >
          {message.content}
        </div>

        {!isUser && message.confidence && <ConfidenceBadge confidence={message.confidence} />}

        {!isUser && message.quickActions && message.quickActions.length > 0 && (
          <div className="flex flex-wrap gap-2" data-testid={`quick-actions-${message.id}`}>
            {message.quickActions.map((action) => {
              const cfg = QUICK_ACTION_CONFIG[action];
              if (!cfg) return null;
              const Icon = cfg.icon;
              return (
                <button
                  key={action}
                  type="button"
                  onClick={() => onQuickAction(action)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors min-h-[44px] ${cfg.color}`}
                  data-testid={`button-quick-action-${action}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
