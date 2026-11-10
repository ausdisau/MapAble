# CURSOR AGENT PROMPT — Accessible Futures proposal-only micro-site

## Mission

You are working in the existing Australian Disability Ltd / MapAble monorepo. Review, test, refine and prepare a high-quality **proposal-only microsite** for the proposed "AI-Enabled Care & Support Community of Practice". Do NOT invent a founded consortium or partnership. The writing should sound like a principled Australian disability-rights organisation: direct, substantive, respectful and optimistic without exaggeration.

## Start here

Repository: https://github.com/ausdisau/MapAble
Branch: feat/proposal-ai-care-community-microsite-20261111
Base: main
Public page if deployed: /proposals/ai-care-community
Code: apps/web/app/proposals/ai-care-community/page.tsx
Styles: apps/web/app/proposals/ai-care-community/page.module.css
Editorial source: apps/web/lib/proposals/ai-care-community-content.ts
Tests: apps/web/tests/proposals/ai-care-community-content.test.ts
Design and release notes: apps/web/docs/proposals/AI_CARE_COMMUNITY_MICROSITE.md

The branch already contains a first implementation. Inspect source code, repository tooling, next/layout dependencies and CI before changing anything. Preserve the existing Next.js App Router, TypeScript and styling conventions.

## Outcome and audience

Create a polished accessible one-page concept proposal intended for:
- people with disability, chosen representatives and advocates;
- care and support workers;
- disability support providers and care businesses;
- technology companies and assistive-technology developers;
- universities, research foundations and research ethics reviewers;
- policymakers and public-sector institutions.

Provide a distinctive, editorial landing-page feel: warm paper, deep green, spacious typography, gentle connected-node artwork, high contrast, no stock photography required.

## Approved content structure

1. Header and conspicuous status: **Concept proposal — for discussion only**.
2. Hero: **Care is a human right. Our technology should begin there.**
3. Explanation of why continuity, accessibility and participation must drive AI research.
4. Six-sector collaboration structure; categories are potential invitees, NOT named members.
5. Four research workstreams: care continuity, explainable AI, workforce, ethical data.
6. A possible synthetic research demonstrator: support-worker cancellation, transport and everyday participation.
7. Proposed listen / co-design / evaluate / decide pathway.
8. Non-negotiable participation rights, AAC access, worker voice, privacy, human review.
9. Public context sources: Australian Disability Ltd mission, Care Economy CRC research priorities, MapAble.
10. Discussion-only CTA to the organisation's publicly listed email info@ausdis.au.
11. Footer that repeats no partnership, no live pilot, no recruitment and no data sharing.

## Non-negotiable factual constraints

- Australian Disability Ltd is the *proposer*. The Community of Practice has NOT been established.
- The Care Economy CRC is an external research reference and a potential organisation to contact. It has NOT agreed to participate or fund anything.
- Do not present any government department, institute, university, charity, worker organisation or provider as a confirmed partner.
- Do not place other institutions' logos on the site.
- Do not fabricate funders, research approvals, budgets, testimonials, quotations, membership metrics, results or future dates.
- MapAble's existing Care/Transport/AI tools include feature-gated and synthetic research work. Do not call this a deployed live AI pilot.
- No automatic recruitment, membership application, data-sharing, AI inference, matching, funding advice or business transaction.
- No form or database writes. The only engagement action is mailto, not a submission endpoint.
- Preserve robots noindex/nofollow until a human approves public release.
- Keep public claims sourced and distinguish intended outcomes from achieved outcomes.
- User agency, consent, dignity, AAC and labour rights supersede efficiency claims.

## Inspect and fix before sign-off

- Check current route compiles with the actual repo package and Next.js version.
- Run targeted Vitest tests, Prettier, ESLint, TypeScript and production build.
- Inspect at 320px, 390px, 768px, 1024px, and 1440px plus 200% and 400% zoom.
- Inspect actual browser view for overflow/clipped text and colour contrast.
- Test skip link, heading structure, anchors, keyboard focus, reduced motion and screen-reader reading order.
- Test decorative SVG is silent to screen readers and meaningful categories are in semantic text.
- Review email link and external links; use secure rel attributes when opening new tabs.
- Check CSP and root layout inheritance. The root may include Google Analytics, AdSense and accessibility widgets: this route itself must not claim it is tracker-free; if a privacy-free preview is required, propose a separate static host rather than unapproved root changes.
- Verify proposal-only statements remain consistent even if copy is edited.

## Commands

    cd apps/web
    pnpm install --frozen-lockfile
    pnpm exec prettier --check app/proposals/ai-care-community/page.tsx app/proposals/ai-care-community/page.module.css lib/proposals/ai-care-community-content.ts tests/proposals/ai-care-community-content.test.ts
    pnpm exec vitest run tests/proposals/ai-care-community-content.test.ts
    pnpm exec eslint app/proposals/ai-care-community/page.tsx lib/proposals/ai-care-community-content.ts tests/proposals/ai-care-community-content.test.ts --max-warnings 0
    pnpm type-check
    pnpm build

If any command fails, report whether the failure comes from this branch or pre-existing main. Do not claim success without running it.

## Do not do

Do not merge to main, deploy to production, update live DNS, create Vercel production aliases, add a live newsletter form, connect CRM/NDIS or clinical data, grant roles/permissions or modify existing authentication. Do not silently broaden this into a product or Care Economy CRC application.

## Deliver

- Updated feature branch with focused repairs only.
- Screenshots/notes for desktop and mobile viewport QA, stored as review artifacts if authorised.
- Exact test commands + outputs, commit SHA, PR review status, accessibility issues, limitations and go/no-go assessment.
- One proposed next action: a human-reviewed public sharing decision, separate from actual publishing.

STOP if asked to claim real partnerships without documentary evidence, enable personal-data processing, or bypass governance or publication approval.