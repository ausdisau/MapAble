import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, Headphones, ClipboardList, Link2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface GuardrailAuditLog {
  id: number;
  sessionId: string;
  userId: string;
  input?: string;
  output?: string | null;
  inputPreview: string;
  outputPreview: string | null;
  toolCalls: string[] | null;
  classifierVerdicts: string[] | null;
  guardrailActions: string[] | null;
  policyRefs: string[] | null;
  policyPackVersion: string;
  flaggedForReview: boolean;
  rawContentIncluded: boolean;
  retentionUntil: string | null;
  createdAt: string;
}

interface ChatHandoff {
  id: string;
  sessionId: string;
  userId: string;
  reason: string;
  status: string;
  channel: string | null;
  assignedTo: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SafeguardingQueueItem {
  id: string;
  kind: "incident" | "complaint" | "consent" | "flag";
  sessionId: string;
  userId: string;
  status: string;
  assignedTo: string | null;
  reviewNotes: string | null;
  title: string;
  detail: string;
  severity: string | null;
  reportable: boolean | null;
  granted: boolean | null;
  policyRefs: string[];
  createdAt: string;
  updatedAt: string;
}

const HANDOFF_STATUS_STYLES: Record<string, string> = {
  requested: "bg-amber-100 text-amber-900",
  assigned: "bg-blue-100 text-blue-900",
  resolved: "bg-emerald-100 text-emerald-900",
};

const QUEUE_STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-100 text-amber-900",
  needs_review: "bg-amber-100 text-amber-900",
  draft: "bg-amber-100 text-amber-900",
  in_review: "bg-blue-100 text-blue-900",
  closed: "bg-emerald-100 text-emerald-900",
};

const KIND_LABELS: Record<SafeguardingQueueItem["kind"], string> = {
  incident: "Incident",
  complaint: "Complaint",
  consent: "Consent",
  flag: "Flag",
};

const KIND_STYLES: Record<SafeguardingQueueItem["kind"], string> = {
  incident: "bg-red-100 text-red-900",
  complaint: "bg-orange-100 text-orange-900",
  consent: "bg-purple-100 text-purple-900",
  flag: "bg-rose-100 text-rose-900",
};

export default function AdminChatGuardrailsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  const canView = isAdmin || user?.role === "provider";
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState<"open" | "all" | "in_review" | "closed">("open");

  // Deep-link support: staff alert emails link to
  // /admin/chat-guardrails?tab=handoffs&handoff=<id>
  const [initialTab] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    return tab === "handoffs" || tab === "audit" || tab === "queue" ? tab : "queue";
  });
  const [highlightedHandoffId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("handoff");
  });
  const highlightedHandoffRef = useRef<HTMLElement | null>(null);

  const logsQuery = useQuery<GuardrailAuditLog[]>({
    queryKey: ["/api/admin/chat/guardrails/audit"],
    enabled: isAdmin,
  });

  const handoffsQuery = useQuery<ChatHandoff[]>({
    queryKey: ["/api/admin/chat/handoffs"],
    enabled: isAdmin,
  });

  const queueQuery = useQuery<SafeguardingQueueItem[]>({
    queryKey: ["/api/admin/chat/safeguarding", queueFilter],
    enabled: canView,
    queryFn: async () => {
      const qs = queueFilter === "all" ? "" : `?status=${queueFilter}`;
      const res = await fetch(`/api/admin/chat/safeguarding${qs}`);
      if (!res.ok) throw new Error("Failed to fetch safeguarding queue");
      return res.json();
    },
  });

  useEffect(() => {
    document.title = "Chat Safeguarding & Guardrail Audit | MapAble";
    const meta = document.querySelector('meta[name="description"]') || document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute("content", "Review and action MapAble Chat safeguarding follow-ups, guardrail actions, flags, policy references and audit logs.");
    document.head.appendChild(meta);
  }, []);

  // Scroll the deep-linked handoff into view once it renders.
  useEffect(() => {
    if (highlightedHandoffId && highlightedHandoffRef.current) {
      highlightedHandoffRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedHandoffId, handoffsQuery.data]);

  async function updateHandoff(id: string, status: string) {
    try {
      await apiRequest("PATCH", `/api/admin/chat/handoffs/${id}`, { status });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chat/handoffs"] });
      toast({ title: "Handoff updated", description: `Marked as ${status}.` });
    } catch (error) {
      toast({ title: "Update failed", description: "Could not update the handoff.", variant: "destructive" });
    }
  }

  async function updateQueueItem(item: SafeguardingQueueItem, body: { status?: string; reviewNotes?: string }) {
    setSavingId(`${item.kind}-${item.id}`);
    try {
      await apiRequest("PATCH", `/api/admin/chat/safeguarding/${item.kind}/${item.id}`, body);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chat/safeguarding"] });
      toast({ title: "Item updated", description: body.status ? `Marked as ${body.status.replace("_", " ")}.` : "Notes saved." });
    } catch (error) {
      toast({ title: "Update failed", description: "Could not update the safeguarding item.", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  }

  if (!canView) {
    return (
      <div className="p-6" data-testid="page-admin-chat-guardrails-denied">
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            This view is only available to MapAble admins and providers.
          </CardContent>
        </Card>
      </div>
    );
  }

  const logs = logsQuery.data || [];
  const handoffs = handoffsQuery.data || [];
  const openHandoffs = handoffs.filter((h) => h.status !== "resolved");
  const queue = queueQuery.data || [];
  const openQueue = queue.filter((q) => q.status !== "closed" && q.status !== "resolved");

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="page-admin-chat-guardrails">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#1B6EB5]/10 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-[#1B6EB5]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-guardrail-title">Chat Safeguarding & Guardrails</h1>
          <p className="text-sm text-muted-foreground" data-testid="text-guardrail-subtitle">
            Review and action safeguarding follow-ups, flagged conversations, classifier verdicts and human handoffs.
          </p>
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList data-testid="tabs-guardrail">
          <TabsTrigger value="queue" data-testid="tab-queue">
            Safeguarding queue{openQueue.length > 0 ? ` (${openQueue.length})` : ""}
          </TabsTrigger>
          {isAdmin && <TabsTrigger value="audit" data-testid="tab-audit">Audit logs</TabsTrigger>}
          {isAdmin && (
            <TabsTrigger value="handoffs" data-testid="tab-handoffs">
              Human handoffs{openHandoffs.length > 0 ? ` (${openHandoffs.length})` : ""}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2" data-testid="text-queue-count">
                <ClipboardList className="w-4 h-4 text-[#1B6EB5]" />
                {queueQuery.isLoading
                  ? "Loading safeguarding queue..."
                  : `${queue.length} item${queue.length === 1 ? "" : "s"} · ${openQueue.length} open`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1" data-testid="filters-queue">
                {(["open", "in_review", "closed", "all"] as const).map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={queueFilter === f ? "default" : "outline"}
                    onClick={() => setQueueFilter(f)}
                    data-testid={`button-queue-filter-${f}`}
                  >
                    {f === "in_review" ? "In review" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </Button>
                ))}
              </div>
              {queue.length === 0 && !queueQuery.isLoading && (
                <div className="text-sm text-muted-foreground" data-testid="text-queue-empty">
                  No safeguarding follow-ups for this filter.
                </div>
              )}
              {queue.map((item) => {
                const key = `${item.kind}-${item.id}`;
                const isSaving = savingId === key;
                const noteValue = noteDrafts[key] ?? item.reviewNotes ?? "";
                return (
                  <article key={key} className="border rounded-lg p-3 space-y-2" data-testid={`card-queue-${key}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${KIND_STYLES[item.kind]}`} data-testid={`badge-queue-kind-${key}`}>
                        {KIND_LABELS[item.kind]}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${QUEUE_STATUS_STYLES[item.status] || "bg-muted text-foreground"}`}
                        data-testid={`status-queue-${key}`}
                      >
                        {item.status.replace("_", " ")}
                      </span>
                      {item.severity && (
                        <span className="rounded-full px-2 py-1 text-xs bg-muted text-foreground" data-testid={`text-queue-severity-${key}`}>
                          {item.severity}
                        </span>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground" data-testid={`text-queue-created-${key}`}>
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="font-semibold text-sm" data-testid={`text-queue-title-${key}`}>{item.title}</div>
                    <p className="text-sm line-clamp-4" data-testid={`text-queue-detail-${key}`}>{item.detail}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Link2 className="w-3.5 h-3.5" />
                      <span data-testid={`text-queue-session-${key}`}>Session {item.sessionId}</span>
                      {item.assignedTo && <span data-testid={`text-queue-assignee-${key}`}>· Assigned to {item.assignedTo}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1" data-testid={`list-queue-policy-${key}`}>
                      {item.policyRefs.map((ref) => (
                        <span key={ref} className="rounded-full bg-slate-100 text-slate-800 px-2 py-1 text-xs" data-testid={`text-queue-policy-${key}-${ref}`}>
                          {ref}
                        </span>
                      ))}
                    </div>
                    <Textarea
                      value={noteValue}
                      placeholder="Add a review note..."
                      onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="text-sm"
                      data-testid={`input-queue-notes-${key}`}
                    />
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() => updateQueueItem(item, { reviewNotes: noteValue })}
                        data-testid={`button-queue-save-notes-${key}`}
                      >
                        Save notes
                      </Button>
                      {item.status !== "in_review" && item.status !== "closed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isSaving}
                          onClick={() => updateQueueItem(item, { status: "in_review", reviewNotes: noteValue })}
                          data-testid={`button-queue-start-${key}`}
                        >
                          Start review
                        </Button>
                      )}
                      {item.status !== "closed" && (
                        <Button
                          size="sm"
                          disabled={isSaving}
                          onClick={() => updateQueueItem(item, { status: "closed", reviewNotes: noteValue })}
                          data-testid={`button-queue-close-${key}`}
                        >
                          Mark closed
                        </Button>
                      )}
                      {item.status === "closed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isSaving}
                          onClick={() => updateQueueItem(item, { status: "open", reviewNotes: noteValue })}
                          data-testid={`button-queue-reopen-${key}`}
                        >
                          Reopen
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-base" data-testid="text-guardrail-count">
                {logsQuery.isLoading ? "Loading audit logs..." : `${logs.length} audit log${logs.length === 1 ? "" : "s"}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {logs.length === 0 && !logsQuery.isLoading && (
                <div className="text-sm text-muted-foreground" data-testid="text-guardrail-empty">
                  No guardrail audit logs found yet.
                </div>
              )}
              {logs.map((log) => (
                <article key={log.id} className="border rounded-lg p-3 space-y-2" data-testid={`card-guardrail-log-${log.id}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold text-sm" data-testid={`text-guardrail-session-${log.id}`}>
                      Session {log.sessionId}
                    </div>
                    {!log.rawContentIncluded && (
                      <div className="text-xs text-muted-foreground" data-testid={`text-guardrail-minimized-${log.id}`}>
                        Sensitive content minimized
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground" data-testid={`text-guardrail-created-${log.id}`}>
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground">Input</div>
                      <p className="line-clamp-4" data-testid={`text-guardrail-input-${log.id}`}>{log.input || log.inputPreview}</p>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground">Output</div>
                      <p className="line-clamp-4" data-testid={`text-guardrail-output-${log.id}`}>{log.output || log.outputPreview || "No output recorded"}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {(log.classifierVerdicts || []).map((item) => (
                      <span key={item} className="rounded-full bg-amber-100 text-amber-900 px-2 py-1" data-testid={`text-guardrail-verdict-${log.id}-${item}`}>
                        {item}
                      </span>
                    ))}
                    {(log.guardrailActions || []).map((item) => (
                      <span key={item} className="rounded-full bg-blue-100 text-blue-900 px-2 py-1" data-testid={`text-guardrail-action-${log.id}-${item}`}>
                        {item}
                      </span>
                    ))}
                    {log.flaggedForReview && (
                      <span className="rounded-full bg-red-100 text-red-900 px-2 py-1" data-testid={`status-guardrail-flagged-${log.id}`}>
                        Human review
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground" data-testid={`text-guardrail-policy-${log.id}`}>
                    Policy pack: {log.policyPackVersion}
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="handoffs">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2" data-testid="text-handoff-count">
                <Headphones className="w-4 h-4 text-[#1B6EB5]" />
                {handoffsQuery.isLoading ? "Loading handoffs..." : `${handoffs.length} handoff${handoffs.length === 1 ? "" : "s"}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {handoffs.length === 0 && !handoffsQuery.isLoading && (
                <div className="text-sm text-muted-foreground" data-testid="text-handoff-empty">
                  No human handoffs requested yet.
                </div>
              )}
              {handoffs.map((h) => (
                <article
                  key={h.id}
                  ref={h.id === highlightedHandoffId ? highlightedHandoffRef : undefined}
                  className={`border rounded-lg p-3 space-y-2 ${h.id === highlightedHandoffId ? "border-[#1B6EB5] ring-2 ring-[#1B6EB5]/40" : ""}`}
                  data-testid={`card-handoff-${h.id}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${HANDOFF_STATUS_STYLES[h.status] || "bg-muted text-foreground"}`}
                      data-testid={`status-handoff-${h.id}`}
                    >
                      {h.status}
                    </span>
                    <div className="text-xs text-muted-foreground" data-testid={`text-handoff-created-${h.id}`}>
                      {new Date(h.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <p className="text-sm" data-testid={`text-handoff-reason-${h.id}`}>{h.reason}</p>
                  <div className="text-xs text-muted-foreground" data-testid={`text-handoff-meta-${h.id}`}>
                    Session {h.sessionId} · Channel {h.channel || "web"}
                  </div>
                  {h.resolutionNotes && (
                    <div className="text-xs text-muted-foreground" data-testid={`text-handoff-notes-${h.id}`}>
                      Notes: {h.resolutionNotes}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {h.status === "requested" && (
                      <Button size="sm" variant="outline" onClick={() => updateHandoff(h.id, "assigned")} data-testid={`button-handoff-assign-${h.id}`}>
                        Assign to me
                      </Button>
                    )}
                    {h.status !== "resolved" && (
                      <Button size="sm" onClick={() => updateHandoff(h.id, "resolved")} data-testid={`button-handoff-resolve-${h.id}`}>
                        Mark resolved
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
