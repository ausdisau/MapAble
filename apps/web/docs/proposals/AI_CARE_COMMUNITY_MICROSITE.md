# Accessible Futures — proposal-only CoP microsite

**Proposer:** Australian Disability Ltd.
**Product context:** MapAble public web route.
**Status:** concept proposal — no programme, research partnership, recruitment, funding or production pilot established.
**Date:** 11 November 2026.

## Route and files

Public route (only if deployed following approval): /proposals/ai-care-community

- app/proposals/ai-care-community/page.tsx — accessible editorial page, navigation and source links.
- app/proposals/ai-care-community/page.module.css — scoped responsive design, visible focus, reduced-motion behaviour.
- lib/proposals/ai-care-community-content.ts — copy, sources and non-production capability flags.
- tests/proposals/ai-care-community-content.test.ts — anti-overclaim and rights safeguards.
- docs/proposals/CURSOR_AI_CARE_COMMUNITY_PROMPT.md — Cursor agent continuation brief.

There is no new API, database, auth, forms, live feeds, partner-directory write action or third-party embed.

## Editorial position

Lead: **Care is a human right. Our technology should begin there.**

This is a discussion invitation, not a service offering. No displayed organisation is claimed to have joined Australian Disability Ltd's proposed Community of Practice, including the Care Economy CRC. External links are sources, not institutional endorsements.

Six invited stakeholder groups: people with disability; workers; providers; businesses; universities/research foundations; government and public institutions.

The first illustrative research question is a support-worker cancellation with consequences for accessible transport and participation. It proposes synthetic scenarios first. It does not conduct participant recruitment, worker matching, autonomous coordination, AI inference or data collection.

## Verified public background links

- Australian Disability Ltd mission: https://www.ausdis.com.au/about
- Care Economy CRC technology/data/workforce programs: https://www.careeconomycrc.com.au/
- MapAble platform context: https://mapable.com.au/

Contact email info@ausdis.au is published on Australian Disability Ltd's website. Re-verify links and material claims before public circulation.

## Proposal-only protections

1. Explicit concept-proposal status strip appears above all navigation.
2. Hero identifies Australian Disability Ltd as proposer.
3. Network section and footer both disclaim partners or pilots.
4. Research project introduced as a possible question, never a funded pilot.
5. No logos of prospective collaborators, no institutional endorsement implied.
6. Only CTA opens the user's mail app; route stores no enquiry itself.
7. Route Next.js metadata has robots noindex/nofollow until release review.
8. No research enrolment, participant-data collection, AI model action, or live data sharing.

**Inherited shell warning:** Existing MapAble root app/layout.tsx loads Google Analytics/AdSense and global providers. This route adds no tracking, but inherits that root behaviour unless the root is separately changed or this concept site is hosted as a separate static application. Do not claim tracking-free behaviour without an actual network audit.

## Cursor review commands

From the MapAble repository in Cursor, check out branch feat/proposal-ai-care-community-microsite-20261111.

    cd apps/web
    pnpm install --frozen-lockfile
    pnpm dev

Visit http://localhost:3000/proposals/ai-care-community.

Then validate:

    pnpm exec prettier --check app/proposals/ai-care-community/page.tsx app/proposals/ai-care-community/page.module.css lib/proposals/ai-care-community-content.ts tests/proposals/ai-care-community-content.test.ts
    pnpm exec vitest run tests/proposals/ai-care-community-content.test.ts
    pnpm exec eslint app/proposals/ai-care-community/page.tsx lib/proposals/ai-care-community-content.ts tests/proposals/ai-care-community-content.test.ts --max-warnings 0
    pnpm type-check
    pnpm build

These are required review gates, NOT verified passing results.

## Accessibility acceptance

Keyboard-only navigation, screen-reader test, responsive widths 320–1440px, 200–400% browser zoom/reflow, contrast, clearly named links, visible focus, reduced motion and no pointer-only functions. The illustration is decorative; all key network concepts are available as text. Test NVDA/Firefox and VoiceOver/Safari where possible.

WCAG 2.2 AA is the target and requires independent checking, not self-certification.

## Release governance and rollback

Do not merge, deploy, index, expand partner names, add signup forms, link the main nav or launch events without Australian Disability Ltd's approval. Keep this as a DRAFT review artifact. For rollback, remove this isolated route and its supporting modules; existing care, transport and AI runtime flows remain untouched.

## Research framing added from supplied paper — 11 November 2026

A user-supplied 31 October 2026 research paper on artificial superintelligence, Australian disability care and community services informed a new **AI accountability** section of the proposal. It is not copied into this public repository, and no public link or attribution to the private source is assumed.

Concepts retained as *research questions*, not verified findings:
- bring disability rights and AI governance into the same research agenda;
- require accessible reasons, effective challenge and supported decision-making;
- compare human and algorithmic judgements while evaluating automation bias;
- consider impact on support workers, relationships, privacy and participant access;
- distinguish current automated decision-making from hypothetical general or superintelligent systems.

**Evidence limits:** The paper itself says its assessment of the enacted wording of the NDIS 2026 automated decision-making provisions was not independently verified against final legislation. The public site therefore contains no definitive claim about that law, the Support at Home algorithm, a particular regulator, a specific death, court outcome or regulatory breach. Before publishing a separate legal explainer or stronger current-affairs claims, independently verify primary legislation, official inquiries, dates and responses. Check permissions before publishing the uploaded paper or linking to it.

**Workflow note:** This change is confined to editorial content, public-facing presentation CSS and proposal-only tests. It does not turn the proposal into an operational AI research service, and does not change membership, partnership or deployment status.
