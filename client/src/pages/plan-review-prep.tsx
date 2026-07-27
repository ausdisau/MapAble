import { useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link, useRoute } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FilePlus2, Printer, AlertTriangle, Eye, ClipboardList } from "lucide-react";
import type { PlanReviewBrief, PlanReviewBriefContent } from "@shared/schema";

const formSchema = z.object({
  participantPseudonym: z.string().min(1, "Required").max(120),
  meetingDate: z.string().max(40).optional(),
  planText: z.string().min(20, "Paste at least a short snippet of the prior plan").max(60000),
  notesText: z.string().max(60000).optional(),
  correspondenceText: z.string().max(60000).optional(),
});
type FormValues = z.infer<typeof formSchema>;

const feedbackSchema = z.object({
  outcome: z.enum(["used_unchanged", "edited_minor", "edited_major", "changed_decision", "discarded"]),
  notes: z.string().max(4000).optional(),
});
type FeedbackValues = z.infer<typeof feedbackSchema>;

const FEEDBACK_LABELS: Record<FeedbackValues["outcome"], string> = {
  used_unchanged: "Used as-is in the meeting",
  edited_minor: "Used with minor edits",
  edited_major: "Used with major edits",
  changed_decision: "Changed how I prepared",
  discarded: "Discarded — not useful",
};

function GeneratorForm({ onCreated }: { onCreated: (id: string) => void }) {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      participantPseudonym: "",
      meetingDate: "",
      planText: "",
      notesText: "",
      correspondenceText: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("POST", "/api/plan-review-briefs", values);
      return (await res.json()) as PlanReviewBrief;
    },
    onSuccess: (brief) => {
      queryClient.invalidateQueries({ queryKey: ["/api/plan-review-briefs"] });
      onCreated(brief.id);
      if (brief.status === "failed") {
        toast({
          title: "Brief generation failed",
          description: brief.errorMessage || "The model could not produce a brief. The draft inputs are saved.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Brief ready", description: "Review it below before your meeting." });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Could not generate brief", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Card data-testid="card-prep-brief-form">
      <CardHeader>
        <CardTitle>Generate a review-prep brief</CardTitle>
        <CardDescription>
          Paste a redacted prior plan, recent progress notes and any provider correspondence. The assistant will draft a 1-page brief for your meeting.
          Please de-identify the source text first — remove names, NDIS numbers, addresses and any other identifying details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="participantPseudonym"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participant pseudonym</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Participant A" data-testid="input-participant-pseudonym" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="meetingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting date (optional)</FormLabel>
                    <FormControl>
                      <Input type="date" data-testid="input-meeting-date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="planText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prior plan (redacted)</FormLabel>
                  <FormControl>
                    <Textarea rows={10} placeholder="Paste relevant sections of the prior NDIS plan here…" data-testid="textarea-plan-text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notesText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recent progress notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={6} placeholder="Paste recent shift notes, allied health summaries, etc." data-testid="textarea-notes-text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="correspondenceText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider correspondence (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={6} placeholder="Paste relevant emails or letters from providers." data-testid="textarea-correspondence-text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground max-w-xl">
                This is a Wizard-of-Oz prototype. The brief is a discussion aid for the coordinator only. It is not a decision, not a record, and must not be shared with the participant or NDIA without your review.
              </p>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-generate-brief">
                {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FilePlus2 className="w-4 h-4 mr-2" />}
                Generate brief
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function BriefView({ brief }: { brief: PlanReviewBrief }) {
  const content = brief.brief as PlanReviewBriefContent | null;

  if (brief.status === "failed" || !content) {
    return (
      <Alert variant="destructive" data-testid="alert-brief-failed">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Brief could not be generated</AlertTitle>
        <AlertDescription>
          {brief.errorMessage || "The model did not return a usable brief. Please try again or use a smaller text excerpt."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 print:space-y-3" data-testid="view-brief">
      <header className="flex items-start justify-between gap-4 print:block">
        <div>
          <h2 className="text-xl font-semibold" data-testid="text-brief-title">
            Review-prep brief — {brief.participantPseudonym}
          </h2>
          <p className="text-sm text-muted-foreground" data-testid="text-brief-meta">
            {brief.meetingDate ? `Meeting ${brief.meetingDate} · ` : ""}
            Generated {brief.createdAt ? new Date(brief.createdAt).toLocaleString() : ""} · Model {brief.modelName ?? "?"} · Prompt {brief.promptVersion ?? "?"}
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()} className="print:hidden" data-testid="button-print-brief">
          <Printer className="w-4 h-4 mr-2" />Print
        </Button>
      </header>

      <section>
        <h3 className="font-semibold mb-2">Participant goals (verbatim)</h3>
        {content.participantGoalsVerbatim.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-no-goals">No goals were quoted from the source text.</p>
        ) : (
          <ul className="space-y-2">
            {content.participantGoalsVerbatim.map((g, i) => (
              <li key={i} className="border-l-4 pl-3 py-1" style={{ borderColor: "#1B6EB5" }} data-testid={`item-goal-${i}`}>
                <blockquote className="italic">&ldquo;{g.quote}&rdquo;</blockquote>
                {g.sourceHint && <p className="text-xs text-muted-foreground mt-1">Source hint: {g.sourceHint}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="font-semibold mb-2">Plan-utilisation summary</h3>
        <p className="text-sm whitespace-pre-wrap" data-testid="text-utilisation-summary">{content.planUtilisationSummary}</p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Flagged budget concerns</h3>
        {content.budgetConcerns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No budget concerns flagged.</p>
        ) : (
          <ul className="space-y-2">
            {content.budgetConcerns.map((b, i) => (
              <li key={i} className="text-sm" data-testid={`item-budget-${i}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{b.lineItemHint}</Badge>
                  <span className="font-medium">{b.item}</span>
                </div>
                <p className="text-muted-foreground mt-1">{b.concern}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="font-semibold mb-2">Suggested questions for the participant</h3>
        {content.suggestedQuestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No questions suggested.</p>
        ) : (
          <ol className="list-decimal list-inside space-y-1 text-sm">
            {content.suggestedQuestions.map((q, i) => (
              <li key={i} data-testid={`item-question-${i}`}>{q}</li>
            ))}
          </ol>
        )}
      </section>

      <section className="rounded-md border-2 border-dashed p-4" style={{ borderColor: "#E6A817" }}>
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Eye className="w-4 h-4" />What this brief did NOT see
        </h3>
        {content.whatAiDidNotSee.length === 0 ? (
          <p className="text-sm text-muted-foreground">The assistant did not flag any explicit gaps. Treat this as a warning sign — verify the source text was complete.</p>
        ) : (
          <ul className="list-disc list-inside space-y-1 text-sm">
            {content.whatAiDidNotSee.map((g, i) => (
              <li key={i} data-testid={`item-gap-${i}`}>{g}</li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-muted-foreground border-t pt-3">
        This brief is a Wizard-of-Oz prototype. It is a discussion aid only. It is not an NDIA decision, not a participant record, and must be reviewed by you before any use. Do not share with the participant verbatim without their explicit consent.
      </p>
    </div>
  );
}

function FeedbackPanel({ brief }: { brief: PlanReviewBrief }) {
  const { toast } = useToast();
  const form = useForm<FeedbackValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      outcome: brief.feedbackOutcome ?? "used_unchanged",
      notes: brief.feedbackNotes ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FeedbackValues) => {
      const res = await apiRequest("POST", `/api/plan-review-briefs/${brief.id}/feedback`, values);
      return (await res.json()) as PlanReviewBrief;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plan-review-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plan-review-briefs", brief.id] });
      toast({ title: "Thanks", description: "Feedback recorded." });
    },
    onError: (err: Error) => toast({ title: "Could not save", description: err.message, variant: "destructive" }),
  });

  return (
    <Card className="print:hidden" data-testid="card-feedback">
      <CardHeader>
        <CardTitle className="text-base">After your meeting — quick feedback</CardTitle>
        <CardDescription>
          This is the only signal that tells us whether the brief was actually trustworthy. Please log it for every meeting, even if the answer is &ldquo;discarded&rdquo;.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-3">
            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How did you use the brief?</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-feedback-outcome">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(FEEDBACK_LABELS) as FeedbackValues["outcome"][]).map((k) => (
                        <SelectItem key={k} value={k}>{FEEDBACK_LABELS[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <Label htmlFor="feedback-notes">What did you change, or what was missing?</Label>
              <Textarea id="feedback-notes" rows={3} {...form.register("notes")} data-testid="textarea-feedback-notes" />
            </div>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-feedback">
              {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save feedback
            </Button>
            {brief.feedbackAt && (
              <p className="text-xs text-muted-foreground">Last saved {new Date(brief.feedbackAt).toLocaleString()}.</p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function HistoryList({ items, activeId, onPick }: { items: PlanReviewBrief[]; activeId: string | null; onPick: (id: string) => void }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No briefs yet.</p>;
  }
  return (
    <ul className="space-y-1">
      {items.map((b) => (
        <li key={b.id}>
          <button
            type="button"
            onClick={() => onPick(b.id)}
            className={`w-full text-left p-2 rounded-md hover-elevate active-elevate-2 text-sm ${activeId === b.id ? "bg-accent" : ""}`}
            data-testid={`button-history-${b.id}`}
          >
            <div className="font-medium truncate">{b.participantPseudonym}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ""}</span>
              <Badge variant={b.status === "generated" ? "secondary" : b.status === "failed" ? "destructive" : "outline"} className="text-[10px]">
                {b.status}
              </Badge>
              {b.feedbackOutcome && <Badge variant="outline" className="text-[10px]">{b.feedbackOutcome}</Badge>}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function PlanReviewPrepPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute<{ id: string }>("/plan-review-prep/:id");
  const activeId = params?.id ?? null;

  const config = useQuery<{ enabled: boolean; allowed: boolean }>({ queryKey: ["/api/plan-review-briefs/config"] });
  const list = useQuery<PlanReviewBrief[]>({
    queryKey: ["/api/plan-review-briefs"],
    enabled: config.data?.allowed === true,
  });
  const detail = useQuery<PlanReviewBrief>({
    queryKey: ["/api/plan-review-briefs", activeId],
    enabled: !!activeId && config.data?.allowed === true,
  });

  const handleCreated = (id: string) => {
    setLocation(`/plan-review-prep/${id}`);
  };

  const handlePick = (id: string) => {
    setLocation(`/plan-review-prep/${id}`);
  };

  const disabled = useMemo(() => config.data && !config.data.enabled, [config.data]);
  const forbidden = useMemo(() => config.data && !config.data.allowed, [config.data]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 print:p-0" data-testid="page-plan-review-prep">
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6" style={{ color: "#1B6EB5" }} />
            Plan-review prep co-pilot
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl mt-1">
            Wizard-of-Oz prototype for Support Coordinators and LAC Navigators. Drafts a 1-page brief from a redacted prior plan plus your own notes. The participant and the NDIA never see the AI output unless you choose to share it.
          </p>
        </div>
        {activeId && (
          <Button variant="outline" onClick={() => setLocation("/plan-review-prep")} data-testid="button-new-brief">
            <FilePlus2 className="w-4 h-4 mr-2" />New brief
          </Button>
        )}
      </div>

      {config.isError && (
        <Alert variant="destructive" data-testid="alert-config-error">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Could not check generator status</AlertTitle>
          <AlertDescription>{(config.error as Error)?.message ?? "Unknown error"}</AlertDescription>
        </Alert>
      )}

      {disabled && (
        <Alert variant="destructive" data-testid="alert-disabled">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Generator unavailable</AlertTitle>
          <AlertDescription>
            The prep-brief generator is disabled in this environment. Set AI credentials and unset PREP_BRIEF_DISABLED to enable.
          </AlertDescription>
        </Alert>
      )}

      {forbidden && !disabled && (
        <Alert variant="destructive" data-testid="alert-forbidden">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Coordinator role required</AlertTitle>
          <AlertDescription>
            This prototype is restricted to coordinator-equivalent roles (carer, provider, admin). Ask an administrator to grant access.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="print:hidden">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent briefs</CardTitle>
            </CardHeader>
            <CardContent>
              {list.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : list.isError ? (
                <p className="text-sm text-destructive" data-testid="text-list-error">Could not load briefs: {(list.error as Error)?.message}</p>
              ) : (
                <HistoryList items={list.data ?? []} activeId={activeId} onPick={handlePick} />
              )}
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-6">
          {!activeId && !disabled && <GeneratorForm onCreated={handleCreated} />}
          {activeId && detail.isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
          {activeId && detail.isError && (
            <Alert variant="destructive" data-testid="alert-detail-error">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Could not load brief</AlertTitle>
              <AlertDescription>{(detail.error as Error)?.message}</AlertDescription>
            </Alert>
          )}
          {activeId && detail.data && (
            <>
              <Card>
                <CardContent className="pt-6">
                  <BriefView brief={detail.data} />
                </CardContent>
              </Card>
              <FeedbackPanel brief={detail.data} />
            </>
          )}
        </main>
      </div>

      <div className="print:hidden text-xs text-muted-foreground">
        <Link href="/" className="underline" data-testid="link-back-home">Back to dashboard</Link>
      </div>
    </div>
  );
}
