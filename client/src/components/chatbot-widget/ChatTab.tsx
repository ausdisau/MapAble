import { useEffect, useRef, useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Mic, MicOff, Bot, User, Plus } from "lucide-react";
import type { ChatMessage, ChatSession } from "@shared/schema";
import type { FeatureFlags } from "./types";

interface ChatTabProps {
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  featureFlags: FeatureFlags;
  seedMessage?: string | null;
  onSeedConsumed?: () => void;
}

interface ChatResponse {
  content: string;
  quickActions: string[];
  confidence: string;
  warnings: string[];
  toolsUsed: string[];
}

type MicState = "idle" | "recording" | "denied" | "unsupported";

export function ChatTab({
  activeSessionId,
  setActiveSessionId,
  featureFlags,
  seedMessage,
  onSeedConsumed,
}: ChatTabProps) {
  const [input, setInput] = useState("");
  const [micState, setMicState] = useState<MicState>("idle");
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<{ role: string; content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const messagesQuery = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/sessions", activeSessionId, "messages"],
    enabled: !!activeSessionId,
    queryFn: async () => {
      const res = await fetch(`/api/chat/sessions/${activeSessionId}/messages`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/chat/sessions");
      return (await res.json()) as ChatSession;
    },
    onSuccess: (session) => {
      setActiveSessionId(session.id);
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
    onError: () => setPendingMessages([]),
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messagesQuery.data, pendingMessages, scrollToBottom]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    if (seedMessage) {
      setInput(seedMessage);
      onSeedConsumed?.();
      inputRef.current?.focus();
    }
  }, [seedMessage, onSeedConsumed]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg) return;
    let sessionId = activeSessionId;
    if (!sessionId) {
      const session = await createSessionMutation.mutateAsync();
      sessionId = session.id;
    }
    setInput("");
    setVoiceTranscript("");
    setPendingMessages([{ role: "user", content: msg }]);
    sendMutation.mutate({ sessionId: sessionId!, message: msg });
    inputRef.current?.focus();
  };

  const handleMicToggle = () => {
    setVoiceError(null);
    if (micState === "recording") {
      recognitionRef.current?.stop?.();
      setMicState("idle");
      return;
    }
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;
    if (!SR) {
      setMicState("unsupported");
      setVoiceError("Voice input is not supported in this browser. Please type your message.");
      return;
    }
    try {
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-AU";
      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceTranscript(transcript);
      };
      recognition.onerror = (event: any) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setMicState("denied");
          setVoiceError("Microphone permission denied. Please enable it in your browser settings or type your message.");
        } else {
          setMicState("idle");
          setVoiceError("Voice input failed. Please try again or type your message.");
        }
      };
      recognition.onend = () => {
        setMicState((prev) => (prev === "recording" ? "idle" : prev));
      };
      recognition.start();
      recognitionRef.current = recognition;
      setMicState("recording");
    } catch {
      setMicState("unsupported");
      setVoiceError("Voice input is not available right now. Please type your message.");
    }
  };

  const acceptTranscript = () => {
    if (voiceTranscript.trim()) {
      setInput(voiceTranscript.trim());
      setVoiceTranscript("");
      inputRef.current?.focus();
    }
  };

  const messages = messagesQuery.data || [];

  return (
    <div className="flex flex-col h-full" data-testid="widget-chat-tab">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="text-xs text-muted-foreground" data-testid="text-chat-session-status">
          {activeSessionId ? "Continuing conversation" : "Starting fresh"}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setActiveSessionId(null);
            setPendingMessages([]);
          }}
          className="h-8 gap-1"
          data-testid="button-widget-new-chat"
        >
          <Plus className="w-3.5 h-3.5" /> New
        </Button>
      </div>

      <div
        className="flex-1 overflow-auto p-3 space-y-3"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        data-testid="widget-chat-messages"
      >
        {messages.length === 0 && pendingMessages.length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground" data-testid="widget-chat-empty">
            Ask anything about accessible transport, NDIS funding, or your bookings.
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} />
        ))}
        {pendingMessages.map((m, i) => (
          <MessageBubble key={`pending-${i}`} role={m.role} content={m.content} />
        ))}
        {sendMutation.isPending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground" data-testid="widget-chat-thinking">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {featureFlags.voiceEnabled && voiceTranscript && (
        <div className="border-t border-border p-3 bg-card space-y-2" data-testid="widget-voice-transcript">
          <div className="text-xs font-semibold text-muted-foreground">Review transcript</div>
          <textarea
            value={voiceTranscript}
            onChange={(e) => setVoiceTranscript(e.target.value)}
            className="w-full text-sm rounded-md border border-input bg-background p-2"
            rows={2}
            aria-label="Voice transcript review"
            data-testid="textarea-voice-transcript"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setVoiceTranscript("")} data-testid="button-voice-discard">
              Discard
            </Button>
            <Button size="sm" onClick={acceptTranscript} data-testid="button-voice-accept">
              Use this
            </Button>
          </div>
        </div>
      )}

      {voiceError && (
        <div
          className="px-3 py-2 text-xs text-destructive border-t border-border"
          role="status"
          data-testid="widget-voice-error"
        >
          {voiceError}
        </div>
      )}

      <div className="border-t border-border p-3 bg-card">
        <div className="flex items-end gap-2">
          {featureFlags.voiceEnabled && (
            <Button
              size="icon"
              variant={micState === "recording" ? "default" : "outline"}
              onClick={handleMicToggle}
              aria-label={micState === "recording" ? "Stop recording" : "Start voice input"}
              aria-pressed={micState === "recording"}
              className="h-11 w-11 shrink-0"
              data-testid="button-voice-toggle"
            >
              {micState === "recording" ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          )}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px] max-h-32 focus:outline-none focus:ring-2 focus:ring-[#1B6EB5]/50"
            disabled={sendMutation.isPending || createSessionMutation.isPending}
            aria-label="Type your message"
            data-testid="textarea-widget-chat-input"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className="h-11 w-11 bg-[#1B6EB5] text-white"
            size="icon"
            aria-label="Send message"
            data-testid="button-widget-send"
          >
            {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ role, content }: { role: string; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-[#1B6EB5] text-white" : "bg-[#2EAA6E]/15 text-[#2EAA6E]"
        }`}
        aria-hidden="true"
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>
      <div
        className={`rounded-2xl px-3 py-2 text-sm max-w-[80%] whitespace-pre-wrap ${
          isUser ? "bg-[#1B6EB5] text-white rounded-br-sm" : "bg-card border border-border rounded-bl-sm"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
