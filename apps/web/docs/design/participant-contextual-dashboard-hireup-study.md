# Participant contextual dashboard — Hireup public-reference integration

Status: draft, unmerged and not a production-readiness claim. Source review: 8 November 2026 (Australia/Sydney).

## Decision

Introduce an original MapAble participant workspace with one grouped left navigation, a deterministic account-context view, and a clearly labelled optional CareOS-assisted view. No changes to worker selection, provider verification, NDIS billing, consent grants, booking execution or role-based authorisation.

## Source boundaries and provenance

- Hireup public technical assessment: https://github.com/hireupau/technical-assessment (Apache-2.0; master). This is an unfinished JavaScript coding exercise for a historical booking-cost calculator, **not** Hireup's production booking, matching, dashboard, or AI source code. The 2017 sample rates and unfinished calculator must NOT be used for MapAble pricing or claims.
- Hireup AI transparency statement: https://help.hireup.com.au/hc/en-us/articles/16164858481295-Hireup-AI-Transparency-Statement-Our-Commitment-to-Responsible-Innovation . Reference principles: matching/discovery assistance, human accountability, minimal sensitive data, explicit AI labels, feedback and safeguards. These statements describe Hireup; they do not establish MapAble readiness.
- Hireup news and features: https://hireup.com.au/latest-news-and-features/ . Editorial/public context only, not a code or integration contract.
- NDS article supplied by product owner: https://www.nds.org.au/learning-and-development/tools-and-guides/resources/from-operational-efficiency-to-smarter-matching-how-hireup-is-using-ai-to-support-workers-clients-and-safety/ . Content could not be independently fetched during this review; do not assert article-specific technical implementation details.

No Hireup source files, brand assets, trademark, pricing, algorithms or personal data are copied into MapAble. There is no Hireup API connection, commercial partnership or worker-data sync.

## Implemented boundaries in this draft

- The existing authenticated dashboard data remain scoped by the session user ID.
- Sidebar groups route to current MapAble pages, with a separate administrator workspace link when permitted by role.
- Programmatic suggestions are simple read-only count rules, and explicitly disclose their evidence and limits. Historical booking counts never become claims of upcoming support or real-time availability.
- CareOS remains optional and subject to the existing feature flag, permissions and consent-gated My Day API. It performs no automatic booking, worker substitution, sharing or payment from this dashboard.
- The dashboard retains non-AI navigation and human help when CareOS is disabled or consent is declined.
- No migrations, new dependencies or pricing/rate changes.

## Required review before merge

1. Verify all links with role-based and direct-route navigation tests. Ensure server-side access checks remain authoritative.
2. Run lint, typecheck and Vitest for the changed files; review differences against existing CI baseline.
3. Manual accessibility acceptance: keyboard, screen readers, switch/AAC use, 200%–400% zoom/reflow, reduced motion, large targets, mobile navigation, logical focus, and high-contrast modes. Target WCAG 2.2 AA; no conformance claim before testing.
4. Verify participant versus administrator presentation, consent denial, flag-off, empty data, stale data, and backend outage.
5. Evaluate any future worker matching under separate risk and fairness review: current screening/credentials must be verified by authorised systems; human/participant choice must remain decisive; unknown screening status must never be inferred as cleared.
6. Independent privacy and operational review for any future AI or service-delivery automation.

## Explicitly out of scope

Importing Hireup's calculator, using historical rates, scraping Hireup workers, building an unapproved model, inferring disability-related risk, replacing preferred workers, automatically booking supports or transport, or enabling production AI/payment flags.
