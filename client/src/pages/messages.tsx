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
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
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
                  {messages?.map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                          {msg.senderId.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold">User</span>
                          <span className="text-[10px] text-muted-foreground">
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ""}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{msg.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t flex gap-2">
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
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
