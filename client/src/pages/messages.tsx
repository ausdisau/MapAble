import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@shared/schema";

const avatarColors = [
  "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
  "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
  "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300",
  "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
  "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300",
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-muted-foreground opacity-40" />
      </div>
      <h3 className="font-bold text-lg mb-1">No messages yet</h3>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        Start a conversation with a support worker or service provider
      </p>
    </div>
  );
}

export default function MessagesPage() {
  const [search, setSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();

  const sendMessage = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/messages", {
        senderId: "demo-participant",
        receiverId: "demo-receiver",
        body: newMessage,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setNewMessage("");
      toast({ title: "Message sent" });
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" data-testid="text-page-title">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Communicate with support workers and service providers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-messages"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-3">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </Card>
              ))}
            </div>
          ) : messages?.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No conversations</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {messages?.map((msg) => (
                <Card key={msg.id} className="p-3 cursor-pointer hover-elevate">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className={`text-xs font-bold ${getAvatarColor(msg.senderId)}`}>
                        {msg.senderId.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-semibold truncate">User</span>
                        {!msg.read && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">New</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{msg.body}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col min-h-[400px]">
            {!messages?.length ? (
              <EmptyState />
            ) : (
              <>
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {messages?.map((msg) => {
                    const isOwn = msg.senderId === "demo-participant";
                    return (
                      <div key={msg.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className={`text-xs font-bold ${getAvatarColor(msg.senderId)}`}>
                            {msg.senderId.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 max-w-[75%] ${isOwn ? "text-right" : ""}`}>
                          <div className={`flex items-baseline gap-2 ${isOwn ? "justify-end" : ""}`}>
                            <span className="text-sm font-semibold">
                              {isOwn ? "You" : "User"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ""}
                            </span>
                          </div>
                          <div className={`inline-block mt-1 px-3 py-2 rounded-md text-sm ${
                            isOwn
                              ? "bg-primary/10 dark:bg-primary/20 text-foreground"
                              : "bg-muted text-foreground"
                          }`}>
                            {msg.body}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-3 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      className="flex-1"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newMessage.trim()) {
                          sendMessage.mutate();
                        }
                      }}
                      data-testid="input-message"
                    />
                    <Button
                      size="icon"
                      disabled={!newMessage.trim() || sendMessage.isPending}
                      onClick={() => sendMessage.mutate()}
                      data-testid="button-send-message"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
