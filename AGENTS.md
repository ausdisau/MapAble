# MapAble Agent Development Standards

Applies to all development in this repository (web, Expo mobile, backend, tests, documentation and agent workflows).

## Read before changing a feature

- [My Support — Participant Sovereignty and Development Doctrine](docs/product/MySupports-docs.md)
- [Feature Development Memory](docs/development/FEATURE-DEVELOPMENT-MEMORY.md)
- The existing feature dossier and related open pull requests.

These are normative project design conventions, not replacements for current source code, accessibility standards, authorisation checks, or human approval.

## Required working method

1. **Protect participant autonomy.** Prioritise the person's choices, ability to refuse, AAC/communication access, dignity, accountability and useful human support. Never infer incapacity or give family/provider accounts blanket authority.
2. **Inspect the actual implementation first.** Use `ausdisau/MapAble` as canonical. Reuse existing identity, consent, care, transport, booking, audit and payment authorities. Keep `apps/web` and `apps/mobile` dependency boundaries intact.
3. **Separate facts and claims.** Label real records, independent verification, synthetic examples, proposed features, unknowns and disputes honestly. Avoid claiming compliance or live service delivery from code alone.
4. **Respect authority boundaries.** AI may propose and explain; only authorised deterministic services may execute. Do not auto-assign workers, cancel care, disclose private data, approve payments or override participant choices.
5. **Ship the smallest safe vertical slice.** For sensitive/unverified features, start with a server-gated, no-write preview and data minimisation. Preserve a non-AI/human path.
6. **Design for refusal and failure.** Include denied sharing, withdrawn consent, worker cancellation, AAC incompatibility, stale evidence, cross-tenant access and unresolved human escalation in tests.
7. **Make accessibility demonstrable.** Target WCAG 2.2 AA and test native VoiceOver/TalkBack, switch, AAC, keyboard, zoom, contrast, large targets and reflow as appropriate; automated tests do not replace participant-led testing.
8. **Document every significant feature.** Create/update `docs/product/<feature>-docs.md` (respect user-specified filenames), the feature register and decision evidence in `docs/development/FEATURE-DEVELOPMENT-MEMORY.md`. Link them from the PR.
9. **Check release gates.** Record actual commands, CI, security findings, preview SHA, consent/privacy/accessibility review, human operational owner and rollback. No production promotion, DNS changes or merges without appropriate approval.

**Always preserve explicit uncertainty. A working prototype is not an authorised service.**

## Current reference features

- My Support: draft [PR #38](https://github.com/ausdisau/MapAble/pull/38) — participant control preview.
- My Day: draft [PR #32](https://github.com/ausdisau/MapAble/pull/32) — LifeVal-inspired dependency and DayEval research.

Recheck live status and current code before using these references as proof.
