import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, MessageSquare, Send, AlertCircle } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/use-page-title";
import type { Message, User, Worker } from "@shared/schema";

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
      <h3 className="font-bold text-lg mb-1">Select a contact</h3>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        Select a contact to start messaging
      </p>
    </div>
  );
}

export default function MessagesPage() {
  usePageTitle("Messages");
  const [search, setSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: me } = useQuery<User>({
    queryKey: ["/api/me"],
  });

  const { data: workersData, isLoading: workersLoading } = useQuery<(Worker & { user?: User })[]>({
    queryKey: ["/api/workers"],
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!selectedContact) return;
      const res = await apiRequest("POST", "/api/messages", {
        senderId: me?.id || "demo-participant",
        receiverId: selectedContact,
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

  const { data: messages, isLoading, isError, refetch } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const filteredMessages = messages?.filter((msg) => {
    if (!selectedContact || !me) return false;
    return (
      (msg.senderId === me.id && msg.receiverId === selectedContact) ||
      (msg.senderId === selectedContact && msg.receiverId === me.id)
    );
  });

  const selectedWorker = workersData?.find((w) => w.userId === selectedContact);
  const selectedWorkerName = selectedWorker?.user?.fullName || "Contact";

  const contactSearch = search.toLowerCase();
  const filteredWorkers = workersData?.filter((w) => {
    if (!contactSearch) return true;
    return w.user?.fullName?.toLowerCase().includes(contactSearch) ||
      w.title?.toLowerCase().includes(contactSearch);
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" data-testid="text-page-title">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Communicate with support workers and service providers
        </p>
      </div>

      {isError && (
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-1">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mb-4">We couldn't load your messages. Please try again.</p>
          <Button onClick={() => refetch()} data-testid="button-retry">Try Again</Button>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-messages"
            />
          </div>

          {workersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-3">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </Card>
              ))}
            </div>
          ) : !filteredWorkers?.length ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No contacts found</p>
            </Card>
          ) : (
            <div className="space-y-2" data-testid="list-contacts">
              {filteredWorkers?.map((worker) => {
                const isSelected = selectedContact === worker.userId;
                const workerName = worker.user?.fullName || "Worker";
                const initials = workerName.slice(0, 2).toUpperCase();
                return (
                  <Card
                    key={worker.id}
                    className={`p-3 cursor-pointer hover-elevate ${isSelected ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setSelectedContact(worker.userId)}
                    data-testid={`card-contact-${worker.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className={`text-xs font-bold ${getAvatarColor(worker.userId)}`}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-semibold truncate">{workerName}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{worker.title}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col min-h-[400px]">
            {!selectedContact ? (
              <EmptyState />
            ) : (
              <>
                <div className="p-3 border-b flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={`text-xs font-bold ${getAvatarColor(selectedContact)}`}>
                      {selectedWorkerName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold" data-testid="text-selected-contact">{selectedWorkerName}</span>
                </div>
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {isError ? (
                    <div className="flex flex-col items-center justify-center h-full py-10">
                      <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">Failed to load messages</p>
                      <Button size="sm" onClick={() => refetch()} data-testid="button-retry-inline">Retry</Button>
                    </div>
                  ) : isLoading ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-10 w-2/3" />
                      ))}
                    </div>
                  ) : !filteredMessages?.length ? (
                    <div className="flex flex-col items-center justify-center h-full py-10">
                      <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    filteredMessages?.map((msg) => {
                      const isOwn = msg.senderId === me?.id;
                      return (
                        <div key={msg.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className={`text-xs font-bold ${getAvatarColor(msg.senderId)}`}>
                              {isOwn ? (me?.fullName?.slice(0, 2).toUpperCase() || "ME") : selectedWorkerName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 max-w-[75%] ${isOwn ? "text-right" : ""}`}>
                            <div className={`flex items-baseline gap-2 ${isOwn ? "justify-end" : ""}`}>
                              <span className="text-sm font-semibold">
                                {isOwn ? "You" : selectedWorkerName}
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
                    })
                  )}
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
                      disabled={!newMessage.trim() || sendMessage.isPending || !selectedContact}
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
