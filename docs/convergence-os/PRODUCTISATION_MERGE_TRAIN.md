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

1. Close superseded: #289, #290, #291, #264, #287, #288, AccessCast duplicates #320–#322/#325, #202
2. Split / do not merge #323 RC1
3. Merge Wave 0 registries **#312**
4. Rebase/merge security **#313**
5. Rebase/merge Communication–Workforce **#314**
6. Split Companion #315 / Provider Ops #316 / Starting Work #317 onto main
7. Archive/defer CareOS parallel platform (#231+)
8. NDIS domain #286 after security — adapters off
9. Consolidate AI Expansion #273 with AI Next (refuse AiAccessPlace)
10. Retire TransportBooking / legacy Invoice writers after migration
11. Controlled pilot (Starting Work)
12. Rescan ConvergenceOS after each merge

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
