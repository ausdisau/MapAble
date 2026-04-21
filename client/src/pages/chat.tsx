import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePageTitle } from "@/hooks/use-page-title";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Send, Plus, Trash2, Bot, User, AlertTriangle, ArrowRight, Bus, Flag, Phone, Copy, Search, UserCog, ChevronDown, ChevronUp, MessageCircle, Shield, Calendar, CreditCard, PieChart } from "lucide-react";
import type { ChatSession, ChatMessage, AccessContextProfile } from "@shared/schema";
import { AccessProfileWizard } from "@/components/access-profile-wizard";
import { BarrierReportForm } from "@/components/barrier-report-form";
import { QUICK_ACTION_CONFIG, CONFIDENCE_CONFIG } from "@/components/chat-shared/quick-actions";

interface ChatResponse {
  content: string;
  quickActions: string[];
  confidence: string;
  warnings: string[];
  toolsUsed: string[];
}


function ConfidenceBadge({ confidence }: { confidence: string }) {
  const config = CONFIDENCE_CONFIG[confidence] || CONFIDENCE_CONFIG.general;
  return (
    <Badge variant={config.variant} className="text-[10px] gap-1" data-testid={`badge-confidence-${confidence}`}>
      <Shield className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

function MessageBubble({
  message,
  onQuickAction,
}: {
  message: ChatMessage;
  onQuickAction: (action: string) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
      data-testid={`message-bubble-${message.id}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? "bg-[#1B6EB5] text-white"
            : "bg-[#2EAA6E]/15 text-[#2EAA6E] dark:bg-[#2EAA6E]/25"
        }`}
        aria-hidden="true"
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[75%] ${isUser ? "items-end" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-[#1B6EB5] text-white rounded-br-md"
              : "bg-card border border-border rounded-bl-md"
          }`}
          data-testid={`text-message-content-${message.id}`}
        >
          {message.content}
        </div>

        {!isUser && message.confidence && (
          <ConfidenceBadge confidence={message.confidence} />
        )}

        {!isUser && message.quickActions && message.quickActions.length > 0 && (
          <div className="flex flex-wrap gap-2" data-testid={`quick-actions-${message.id}`}>
            {message.quickActions.map((action) => {
              const config = QUICK_ACTION_CONFIG[action];
              if (!config) return null;
              const Icon = config.icon;
              return (
                <button
                  key={action}
                  onClick={() => onQuickAction(action)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors min-h-[44px] ${config.color}`}
                  data-testid={`button-quick-action-${action}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {config.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionList({
  sessions,
  activeId,
  onSelect,
  onDelete,
  onNew,
}: {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="flex flex-col h-full" data-testid="session-list-panel">
      <div className="p-3 border-b border-border">
        <Button
          onClick={onNew}
          className="w-full gap-2 bg-[#1B6EB5] text-white min-h-[44px]"
          data-testid="button-new-chat"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {sessions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-sessions">
            No conversations yet
          </p>
        )}
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-colors min-h-[44px] ${
              s.id === activeId ? "bg-[#1B6EB5]/10 border border-[#1B6EB5]/30" : "border border-transparent"
            }`}
            onClick={() => onSelect(s.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") onSelect(s.id); }}
            data-testid={`session-item-${s.id}`}
          >
            <MessageCircle className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm truncate flex-1">{s.title || "New conversation"}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(s.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded min-w-[28px] min-h-[28px] flex items-center justify-center"
              aria-label="Delete conversation"
              data-testid={`button-delete-session-${s.id}`}
            >
              <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  usePageTitle("MapAble Chat");
  const { toast } = useToast();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [showSessions, setShowSessions] = useState(false);
  const [showProfileWizard, setShowProfileWizard] = useState(false);
  const [showBarrierReport, setShowBarrierReport] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<{ role: string; content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const profileQuery = useQuery<AccessContextProfile | null>({
    queryKey: ["/api/access-profile"],
  });

  const sessionsQuery = useQuery<ChatSession[]>({
    queryKey: ["/api/chat/sessions"],
  });

  const messagesQuery = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/sessions", activeSessionId, "messages"],
    enabled: !!activeSessionId,
    queryFn: async () => {
      const res = await fetch(`/api/chat/sessions/${activeSessionId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/chat/sessions");
      return res.json();
    },
    onSuccess: (session: ChatSession) => {
      setActiveSessionId(session.id);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/chat/sessions/${id}`);
    },
    onSuccess: (_data, deletedId) => {
      if (activeSessionId === deletedId) setActiveSessionId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async ({ sessionId, message }: { sessionId: string; message: string }) => {
      const res = await apiRequest("POST", "/api/chat/send", { sessionId, message });
      return res.json() as Promise<ChatResponse>;
    },
    onSuccess: () => {
      setPendingMessages([]);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions", activeSessionId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
    },
    onError: (err) => {
      setPendingMessages([]);
      toast({ title: "Chat Error", description: err.message, variant: "destructive" });
    },
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messagesQuery.data, pendingMessages, scrollToBottom]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg) return;

    let sessionId = activeSessionId;
    if (!sessionId) {
      const session = await createSessionMutation.mutateAsync();
      sessionId = session.id;
    }

    setInput("");
    setPendingMessages([{ role: "user", content: msg }]);
    sendMutation.mutate({ sessionId: sessionId!, message: msg });
    inputRef.current?.focus();
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "book_transport":
        window.location.href = "/transport";
        break;
      case "report_barrier":
        setShowBarrierReport(true);
        break;
      case "escalate":
        if (activeSessionId) {
          setInput("I need to speak with a human support person");
          inputRef.current?.focus();
        }
        break;
      case "edit_profile":
        setShowProfileWizard(true);
        break;
      case "view_workers":
        window.location.href = "/care";
        break;
      case "view_pricing":
        window.location.href = "/pricing";
        break;
      case "view_shifts":
        window.location.href = "/care";
        break;
      case "pay_invoice":
        window.location.href = "/invoices";
        break;
      case "check_budget":
        window.location.href = "/budget";
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const allMessages = messagesQuery.data || [];
  const showWelcome = !activeSessionId || allMessages.length === 0;
  const hasProfile = profileQuery.data && profileQuery.data.id;

  const welcomeChips = [
    { label: "Plan a trip", message: "I need to plan an accessible trip" },
    { label: "Check accessibility", message: "Can you check the accessibility of a location for me?" },
    { label: "Report a barrier", message: "I want to report an accessibility barrier" },
    { label: "Transport options", message: "What transport options are available for me?" },
    { label: "NDIS pricing", message: "What are the current NDIS transport pricing tiers?" },
    { label: "View shifts", message: "What's my next shift?" },
    { label: "Pay invoice", message: "How much do I owe?" },
    { label: "Check budget", message: "What's my NDIS budget for transport?" },
  ];

  return (
    <div className="flex h-full" data-testid="chat-page">
      <div className={`border-r border-border bg-card w-72 shrink-0 hidden md:flex flex-col`}>
        <SessionList
          sessions={sessionsQuery.data || []}
          activeId={activeSessionId}
          onSelect={setActiveSessionId}
          onDelete={(id) => deleteSessionMutation.mutate(id)}
          onNew={() => createSessionMutation.mutate()}
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between p-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setShowSessions(!showSessions)}
              aria-label="Toggle session list"
              data-testid="button-toggle-sessions"
            >
              {showSessions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#2EAA6E]/15 flex items-center justify-center">
                <Bot className="w-4 h-4 text-[#2EAA6E]" />
              </div>
              <div>
                <h1 className="text-sm font-semibold" data-testid="text-chat-title">MapAble Chat</h1>
                <p className="text-[11px] text-muted-foreground">Accessibility-aware travel assistant</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!hasProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfileWizard(true)}
                className="gap-1.5 min-h-[44px] text-xs"
                data-testid="button-setup-profile"
              >
                <UserCog className="w-3.5 h-3.5" />
                Set Up Access Profile
              </Button>
            )}
          </div>
        </div>

        {showSessions && (
          <div className="md:hidden border-b border-border bg-card max-h-64 overflow-auto">
            <SessionList
              sessions={sessionsQuery.data || []}
              activeId={activeSessionId}
              onSelect={(id) => { setActiveSessionId(id); setShowSessions(false); }}
              onDelete={(id) => deleteSessionMutation.mutate(id)}
              onNew={() => { createSessionMutation.mutate(); setShowSessions(false); }}
            />
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4" role="log" aria-live="polite" aria-label="Chat messages" data-testid="chat-messages-area">
          {showWelcome && (
            <div className="flex flex-col items-center justify-center text-center py-12 md:py-20 gap-6" data-testid="chat-welcome">
              <div className="w-16 h-16 rounded-full bg-[#2EAA6E]/15 flex items-center justify-center">
                <Bot className="w-8 h-8 text-[#2EAA6E]" />
              </div>
              <div className="space-y-2 max-w-lg">
                <h2 className="text-xl font-bold" data-testid="text-welcome-heading">Welcome to MapAble Chat</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  I'm your accessibility-aware travel assistant. I can help you plan accessible journeys,
                  find transport, report barriers, and navigate NDIS support services.
                </p>
              </div>

              {!hasProfile && (
                <Card className="p-4 max-w-sm border-amber-500/30 bg-amber-500/5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-left space-y-2">
                      <p className="text-sm font-medium">Set up your Access Profile</p>
                      <p className="text-xs text-muted-foreground">
                        Tell me about your mobility needs so I can give you personalised guidance.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setShowProfileWizard(true)}
                        className="gap-1.5 min-h-[44px] bg-[#1B6EB5] text-white"
                        data-testid="button-welcome-setup-profile"
                      >
                        <UserCog className="w-3.5 h-3.5" />
                        Set Up Profile
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {welcomeChips.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => {
                      setInput(chip.message);
                      inputRef.current?.focus();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border border-border bg-card min-h-[44px] transition-colors"
                    data-testid={`button-welcome-chip-${chip.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {allMessages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} onQuickAction={handleQuickAction} />
          ))}

          {pendingMessages.map((msg, i) => (
            <div key={`pending-${i}`} className="flex gap-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-[#1B6EB5] text-white flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="max-w-[85%] md:max-w-[75%]">
                <div className="rounded-2xl rounded-br-md px-4 py-3 text-sm bg-[#1B6EB5] text-white">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {sendMutation.isPending && (
            <div className="flex gap-3" data-testid="chat-thinking-indicator">
              <div className="w-8 h-8 rounded-full bg-[#2EAA6E]/15 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[#2EAA6E]" />
              </div>
              <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-card border border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border p-3 bg-card" data-testid="chat-input-area">
          <div className="flex items-end gap-2 max-w-3xl mx-auto">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about accessible transport, journey planning, or report a barrier..."
              className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm min-h-[44px] max-h-32 focus:outline-none focus:ring-2 focus:ring-[#1B6EB5]/50"
              rows={1}
              disabled={sendMutation.isPending}
              data-testid="input-chat-message"
              aria-label="Type your message"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sendMutation.isPending}
              className="min-h-[44px] min-w-[44px] bg-[#1B6EB5] text-white rounded-xl"
              data-testid="button-send-message"
              aria-label="Send message"
            >
              {sendMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {showProfileWizard && (
        <AccessProfileWizard
          onClose={() => {
            setShowProfileWizard(false);
            queryClient.invalidateQueries({ queryKey: ["/api/access-profile"] });
          }}
        />
      )}

      {showBarrierReport && (
        <BarrierReportForm
          onClose={() => setShowBarrierReport(false)}
          onSubmitted={() => {
            setShowBarrierReport(false);
            toast({ title: "Barrier Reported", description: "Thank you for helping improve accessibility." });
          }}
        />
      )}
    </div>
  );
}
