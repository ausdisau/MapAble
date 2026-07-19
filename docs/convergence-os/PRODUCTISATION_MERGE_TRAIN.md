# Productisation Merge Train

Advisory human-executed merge train for the **MapAble Productisation and Connected Service Programme**.

Machine seed: `lib/convergence-os/trains/productisation-merge-train.ts` (`PRODUCTISATION_MERGE_TRAIN`).

## Foundational rules

- ConvergenceOS never auto-merges. Cursor agents may propose; humans approve; GitHub executes.
- No unmerged stack deeper than **3** PRs.
- No second canonical writer without an approved architecture decision.
- Giant release branches (e.g. #323 RC1) must be split — never merged whole.
- Feature flags alone do not authorise production claims or live integrations.

## Order (summary)

**Completed on main (`fb80bc83`):** Wave 0 #312/#313/#314; AccessCast #324; productisation #327 (Companion/Ops/Care–Transport–Billing/synthetic Starting Work).

**Active leadership train (depth ≤ 3)** — see [LEADERSHIP_TRAIN_RECONCILIATION.md](../remediation/LEADERSHIP_TRAIN_RECONCILIATION.md):

1. Merge strategy **#331** (no product migration)
2. Rebase/merge Trust Fabric **#328** (`20260717120000`)
3. Rebase/merge Access Evidence **#329** (`20260717130000`)
4. Queue Starting Work DB **#330** (`20260717140000`)
5. Close colliding Opportunity tips **#332–#335**; recreate Transport quotes / Recurring Care with `…150000` / `…160000`
6. Defer mega-branches (#301 Continuity, #309 AccessOps, #319 Replay Lab, RightsOS #280, AI giants) — extract only
7. Rescan ConvergenceOS after each merge

## Canonical conflicts to refuse

| Conflict | Canonical winner | Action |
| --- | --- | --- |
| TransportBooking vs TransportTrip | TransportTrip | retire Booking writers after migration |
| Invoice vs BillingInvoice | BillingInvoice | migrate then retire |
| Continuity tips vs ContinuityOS | ContinuityOS (single) | consolidate #301; close #287/#288 |
| VisionAccess standalone vs bridge | #308 bridge | close #291 |
| AccessCast duplicate stacks vs #324 | #324 on main | close #320–#322/#325 |
| CivicAsset vs AccessOps | AccessOps adapters | consolidate #309 |
| AI legacy / #266 vs AI Next + #273 | AI Next + consolidated Expansion | close #264; supersede #266 |
| CareOSMission fork vs Care/Case | Care on main | archive/defer CareOS stack |
| Supabase Auth vs NextAuth | NextAuth | close #202 |
| RC1 mega-branch | domain-owned PRs | split #323 |

## Exit criteria (Wave 0)

- [x] Ledger refreshed for #324 / #300 / #302 already on main
- [ ] Superseded PRs closed or supersede-labelled (human close step)
- [x] Public-claim registry blocks production wording for synthetic modules
- [x] Capability seeds include productisation targets with honest `implemented: false` where packages missing
- [x] Migration timestamp uniqueness scan green
- [x] Stack depth policy encoded (max 3)
- [x] No product schema / feature flags enabled in Wave 0 PR
