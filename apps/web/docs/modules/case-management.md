# AI-Enabled Case Management

A longitudinal case-management module for support coordinators, plan
managers, and admins. Cases bundle a participant context with notes,
tasks, links to other entities (bookings, incidents, documents) and
AI-generated insights (summary, risk, next-actions, search).

## Why a deterministic AI engine first

The default engine lives in `lib/cases/ai/` and is a transparent,
rule-based scorer. It runs locally with no external API key, produces
auditable signals, and caps its own confidence so humans must
acknowledge insights before they influence escalation. A real LLM
backend can replace it by implementing the `CaseAIEngine` interface in
`lib/cases/ai/types.ts` and calling `setCaseAIEngine()` at startup.

This mirrors how the rest of the platform handles automated decisions:
suggestions, not actions (see [incidents](./incidents.md) and the
existing `NdisRuleWarning` model). All insights are written with
`requiresReview: true` and must be explicitly acknowledged.

## Module layout

```
lib/cases/
  case-service.ts     CRUD, notes, tasks, links, runCaseAI(), search
  case-access.ts      Role-scoped where-clause + can-access helpers
  ai/
    engine.ts         Pluggable CaseAIEngine (defaults to RulesEngine)
    risk-classifier.ts
    summary-generator.ts
    next-actions.ts
    nl-search.ts
    types.ts          CaseSnapshot + engine contract

app/api/cases/
  route.ts                          GET list, POST create
  [caseId]/route.ts                 GET, PATCH
  [caseId]/notes/route.ts           POST
  [caseId]/tasks/route.ts           POST
  [caseId]/tasks/[taskId]/route.ts  PATCH
  [caseId]/links/route.ts           POST
  [caseId]/ai/route.ts              GET history, POST run
  [caseId]/ai/[insightId]/route.ts  POST acknowledge
  search/route.ts                   POST natural-language search

app/dashboard/cases/
  page.tsx                List + NL search entry
  new/page.tsx            Create form (server action)
  [caseId]/page.tsx       Detail (notes, tasks, AI panel)
  search/page.tsx         AI search results
```

## Permissions

Added to `lib/auth/permissions.ts`:

| Permission         | Granted to                               |
| ------------------ | ---------------------------------------- |
| `case:read:self`   | participant                              |
| `case:read:any`    | support_coordinator, plan_manager, admin |
| `case:manage:self` | support_coordinator, plan_manager        |
| `case:manage:any`  | mapable_admin                            |
| `case:ai:run`      | support_coordinator, plan_manager, admin |

Row-level scoping is enforced by `caseListWhereForUser`,
`canUserAccessCase`, and `canUserManageCase` in
`lib/cases/case-access.ts`.

## Feature flags

`lib/config/case-management.ts` reads four env vars (see
`.env.example`):

```
CASE_MANAGEMENT_ENABLED=true     # gate the entire module (404 when off)
CASE_MANAGEMENT_AI_ENABLED=true  # gate the AI endpoints only
CASE_MANAGEMENT_AI_AUTORUN=false # run a baseline summary on create
CASE_MANAGEMENT_AI_ENGINE_ID=rules-v1  # stamped on every CaseAIInsight row
```

## Database

New models in `prisma/schema.prisma`:

- `Case` — reference, title, description, status, priority, category,
  riskLevel, participant/assignedTo/createdBy/closedBy, tagsJson,
  goalsJson, aiOptOut, lastAiRunAt.
- `CaseNote` — body, isPrivate, pinned.
- `CaseTask` — title, details, status, priority, dueAt, assignee,
  aiSuggested.
- `CaseLink` — typed link to bookings, incidents, support tickets,
  documents, funding sources, service agreements, external URLs, or
  notes.
- `CaseAIInsight` — kind (`summary`, `risk_assessment`, `next_action`,
  `search_result`), engine id, summary text, detailJson, confidence,
  requiresReview, requestedBy, acknowledgedAt/By.

Deploy:

```
npx prisma db push && npx prisma generate
# or in CI/production
npx prisma migrate deploy
```

## AI engine details

Each scorer is intentionally short and explainable.

**Risk classifier** (`risk-classifier.ts`) — accumulates fixed-weight
signals from title/description/notes/tasks: critical-language match
(`+0.5`), elevated-language (`+0.25`), moderate-language (`+0.1`), up to
`+0.3` for overdue tasks, `+0.25` for urgent priority, `+0.2` for
safeguarding category. The total maps to a `CaseRiskLevel` band. Every
matched signal is returned so reviewers can see why.

**Summariser** (`summary-generator.ts`) — extractive: tokenises notes
and description, scores sentences by mean word-frequency, returns the
top three with an "AI-generated; verify with the participant" framing.
Never invents facts.

**Next actions** (`next-actions.ts`) — rule set keyed on case state
(empty notes, overdue tasks, missing owner, elevated risk) and content
keywords (funding/budget, transport, housing/eviction). Output is
deduplicated and capped to 5 suggestions.

**Natural-language search** (`nl-search.ts`) — strips stop-words and a
short list of intent verbs, scores each candidate by term-frequency
across title/description/category/notes/tasks/tags, boosts exact
phrases and high-risk/urgent cases.

## Swapping in an LLM backend

```ts
import { setCaseAIEngine } from "@/lib/cases/ai/engine";

setCaseAIEngine({
  id: "openai-gpt-foo-2026",
  maxConfidence: 0.9,
  classifyRisk: (snapshot) => {
    /* call your LLM */
  },
  summarise: (snapshot) => {
    /* ... */
  },
  nextActions: (snapshot) => {
    /* ... */
  },
  search: (query, candidates) => {
    /* ... */
  },
});
```

The engine id is persisted on every `CaseAIInsight` row so audit logs
remain unambiguous about which model produced which output.

## Audit

`runCaseAI` writes an `AuditEvent` of `case.ai.<kind>` with the engine
id and confidence in `metadata`. Acknowledgements, updates, and
closures also produce audit events.

## Testing

```
pnpm test tests/case-management.test.ts
```

21 unit tests cover permissions, access scoping, risk classification,
summarisation, next-action generation, and natural-language search.

## Limitations / TODO

- Provider-organisation scoping for `case:read:any` is intentionally
  not modelled yet — coordinator visibility is currently global once
  the role permission is granted.
- The AI engine does not consult linked entities directly; that would
  require widening `CaseSnapshot`. Easy to add when needed.
- The natural-language search is single-language (English) and
  term-frequency based. A vector backend can be slotted in via the
  `CaseAIEngine.search` method without changing any callers.
