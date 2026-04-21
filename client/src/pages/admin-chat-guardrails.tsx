import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function AdminChatGuardrailsPage() {
  const { user } = useAuth();
  const canView = user?.role === "admin";
  const logsQuery = useQuery<GuardrailAuditLog[]>({
    queryKey: ["/api/admin/chat/guardrails/audit"],
    enabled: canView,
  });

  useEffect(() => {
    document.title = "Chat Guardrail Audit | MapAble";
    const meta = document.querySelector('meta[name="description"]') || document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute("content", "Review MapAble Chat guardrail actions, safeguarding flags, policy references and audit logs.");
    document.head.appendChild(meta);
  }, []);

  if (!canView) {
    return (
      <div className="p-6" data-testid="page-admin-chat-guardrails-denied">
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            This audit view is only available to MapAble admins.
          </CardContent>
        </Card>
      </div>
    );
  }

  const logs = logsQuery.data || [];

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="page-admin-chat-guardrails">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#1B6EB5]/10 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-[#1B6EB5]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-guardrail-title">Chat Guardrail Audit</h1>
          <p className="text-sm text-muted-foreground" data-testid="text-guardrail-subtitle">
            Review flagged conversations, classifier verdicts, tool calls and policy references.
          </p>
        </div>
      </div>

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
    </div>
  );
}