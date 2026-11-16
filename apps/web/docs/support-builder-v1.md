# MapAble Support Builder v1 — Chat-first provider discovery (controlled preview)

**Status:** Implemented in a draft PR; not deployed or verified live.  
**Surface:** \`/provider-finder/builder\` (default-disabled).  
**Existing authority:** NextAuth remains the MapAble account issuer; Prisma via the existing \`DATABASE_URL\` remains the database access layer. No AD.iD or payment migration is included.

## Why this vertical slice exists

Participants should be able to describe a life goal, select their own support components, add an approximate locality and explore potential provider leads without first knowing NDIS terminology. The interface borrows the chat layout and editable-sidebar pattern of general-purpose AI assistants, but does not act as a booking or eligibility authority.

## User journey and accessible controls

1. Describe a goal or select a starter prompt, using text input (future AAC/voice adapters optional).
2. See automatically suggested support *categories* from a deterministic keyword helper; manually tick or untick choices.
3. Enter suburb/region/postcode, frequency and an optional provider/service term.
4. Request a read-only database search. Results show record source, stated office locality, source-date, and explicit unknowns.
5. Review, copy or manually revise an unsaved package. Use the existing Provider Finder for additional discovery.
6. No automatic enquiry, booking, payment, registration determination, worker matching or sharing.

**Accessible fallback:** When AI is disabled/unavailable, the same component checkboxes, frequency selector and provider search work without model calls. Chat controls have labels, a live log, keyboard send, stop, visible alert text and reduced-motion spinner behaviour. WCAG 2.2 AA conformance requires real assistive-technology and keyboard testing before release.

## Code map

| Path | Responsibility |
| --- | --- |
| \`app/provider-finder/builder/page.tsx\` | Server-side feature gate + non-indexable metadata |
| \`app/provider-finder/builder/SupportBuilderClient.tsx\` | Chat-first responsive user interface and editable draft |
| \`app/api/provider-finder/builder/chat/route.ts\` | AI SDK v6 streaming via Vercel AI Gateway; no tool actions |
| \`app/api/provider-finder/builder/search/route.ts\` | Read-only database-backed provider search |
| \`lib/support-builder/core.ts\` | Shared types, deterministic category suggestions, URL safety |
| \`lib/support-builder/discovery.ts\` | Existing Prisma provider tables and conservative provenance mapper |
| \`tests/support-builder-core.test.ts\` | Non-inferential, unsent-draft and URL safety tests |

## Neon data inspected on 17 November 2026

- The account has a \`MabAble\` Neon project in \`aws-ap-southeast-2\` (Sydney region).
- Its default \`production\` branch contains \`Provider\` and \`ServiceLocation\` tables, with **two records each** at the time inspected. A different database might be configured for MapAble production through Vercel.
- The canonical repository also defines \`NdisProvider\`, mapped to \`ndis_providers\`, but this table was **not present** in the inspected \`MabAble\` Neon project.
- The preview search tries the repository's \`ndisProvider\` model first and falls back to its existing \`Provider\` model. It does not assume an absent importer means no provider exists.
- **No SQL migration, account changes, provider record inserts or live database writes were performed.** The UI does not persist conversations or drafts.

The actual \`DATABASE_URL\` configured in the Vercel deployment must be independently checked before the preview is connected. Use a dedicated least-privilege read-only database role for search, and keep credentials in encrypted Vercel environment variables; no database password is included in the code.

## Vercel and AI SDK configuration

Existing dependencies \`ai\` ^6.0.196 and \`@ai-sdk/react\` ^3.0.198 in \`apps/web/package.json\` are reused. Chat streaming uses \`streamText\`, \`gateway\`, \`convertToModelMessages\`, \`toUIMessageStreamResponse\`, \`useChat\` and \`DefaultChatTransport\`.

Set these **only in a protected preview** after security review:

\`\`\`env
MAPABLE_SUPPORT_BUILDER_ENABLED=true
MAPABLE_SUPPORT_BUILDER_AI_ENABLED=true
MAPABLE_SUPPORT_BUILDER_MODEL=openai/gpt-oss-20b
# DATABASE_URL=<pooled, least-privilege Neon preview connection>
# AI_GATEWAY_API_KEY=<secret if Vercel OIDC authentication is not used>
\`\`\`

These flags are absent / false by default. Model choice is allowlisted to \`openai/gpt-oss-20b\` or \`openai/gpt-oss-120b\`; both were visible in the Vercel AI Gateway model catalog on 17 November 2026. The gateway's actual processing location, subprocessors, logging and residency must be verified separately. A Sydney-region database does not itself make the AI flow Australian sovereign.

## Deployment mapping: blocker

The connected Vercel \`mapableau\` and \`mapableau-new\` projects were both linked to the **legacy \`ausdisau/mapableau-new\` Git repository** at inspection; the canonical \`ausdisau/MapAble\` repository was not listed as linked. Do not reconfigure these projects, assign production domains, merge this PR, or connect new secrets automatically. Choose a separately protected canonical preview after approval and explicit cost/ownership review.

## Known risks, release gates and owner decisions

1. **Provider evidence:** An office address or recorded registration flag is not proof of geographic coverage, current worker screening, available vacancies, competence or suitability. Do not give a numerical match score from unknown data.
2. **Coverage:** Two rows are not a useful national directory. Importer reconciliation and official source refresh are required before describing this as locally comprehensive.
3. **AI data location:** Model inference, request logging and subprocessors might be outside Australia. The UI warns users not to enter identifying health information. Conduct a privacy impact assessment before public use.
4. **Rate limiting:** The existing shared helper is **process-local** and not sufficient for a multi-instance public AI route. Keep the feature and AI off until a distributed enforcement mechanism is verified.
5. **Identity/consent:** There is no chat persistence in v1; future saved drafts must be owned by the signed-in participant or scoped delegate, with explicit save, deletion, retention and withdrawal.
6. **Accessibility:** Check keyboard-only use, screen-reader labels/live regions, switch input, 200% zoom, mobile reflow, contrast, and a non-AI path. A successful render is not WCAG certification.
7. **Runtime:** Confirm \`@prisma/client\` has been generated from the canonical schema, and run version-matched SDK integration checks.
8. **Security:** This is a public-read directory API only while behind preview protection. Provider source URLs are validated as http/https. No model tool calls can mutate services.
9. **Rollback:** Disable \`MAPABLE_SUPPORT_BUILDER_ENABLED\` or remove the preview deployment. No database rollback is required for v1.

## Suggested validation commands

\`\`\`bash
pnpm --dir apps/web exec vitest run tests/support-builder-core.test.ts
pnpm --dir apps/web exec tsc --noEmit
pnpm --dir apps/web exec eslint app/provider-finder/builder app/api/provider-finder/builder lib/support-builder tests/support-builder-core.test.ts --max-warnings 0
\`\`\`

**GO:** Draft PR review, isolated protected preview, synthetic end-to-end testing and database connection diagnostics.  
**NO-GO:** Public access, automatic provider matching or worker assignment, sensitive conversation persistence, billing, registration claims, or production deployment without additional review.

## Future stages, explicitly outside v1

- Import official provider datasets and add source timestamps/registration status checks, preserving disagreement and unknown states.
- One editable support-package record (owned/consented, versioned, export/delete), then optional conversation history in an isolated Neon schema.
- Evidence-backed service coverage, authentic availability enquiries and human-assisted coordination.
- Participant-authorised handoff to MapAble Care and MapAble Day, with transport dependencies kept distinct.
