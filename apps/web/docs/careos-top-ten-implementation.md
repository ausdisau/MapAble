# CareOS top-ten opportunities — implementation note

**Branch:** `agent/careos-top-ten-implement`  
**Base:** `agent/careos-platform-completion` (+ opportunity portfolio docs)  
**Mode:** MVP vertical slices on the **canonical CareOS mission / event spine**

## Delivered slices

| ID | Product surface | Key paths |
|----|-----------------|-----------|
| O1 | Unified prohibited-use registry + flag namespace doc | `lib/careos/policy/unified-prohibited-uses.ts` |
| O2 | Platform registration pack (prepare/export only) | `lib/careos/opportunities/platform-registration-pack.ts`, `/admin/platform-registration` |
| O3 | Scheme taxonomy + mission tags + navigation briefs | `scheme-coordination.ts`, `/api/coordinator/scheme-brief` |
| O5 | Consent & credential wallet + preferential receipts | `consent-wallet.ts`, privacy UI panel, `/api/participant/consent-wallet` |
| O6 | Safety evaluation gate + CI job | `safety-evaluation-gate.ts`, CareOS validation workflow |
| O7 | Thin-market continuity signals (no scores) | `thin-market-continuity.ts`, `/admin/thin-market` |
| O8 | Academy → pending competency proposals | `workforce-passport-adapter.ts`, provider Workforce Passport page |
| O9 | Access Evidence Graph read API | `access-evidence-graph.ts`, `/api/access/evidence-graph` |
| O10 | Lifespan / Support at Home liaison briefs | `lifespan-liaison.ts`, `/coordinator/lifespan` |
| O12 | Mandatory tenant context enforcement | `tenant-isolation.ts`, `/api/admin/tenant-context/assert` |

Migration: `prisma/migrations/20260714180000_careos_top_ten_opportunities`.

## Safety invariants preserved

- No automated eligibility, diagnosis/treatment, payment, claim, or provider/worker selection  
- No participant risk / worthiness scores  
- Unknown evidence remains unknown; ratings ≠ verified  
- Registration pack `claimSubmissionEnabled` always false  
- Competency proposals start `pending`; humans verify  
- Non-AI / human pathways remain available for every MVP surface  

## Tests

`tests/careos/opportunities/top-ten-opportunities.test.ts` covers O1–O10 + O12 slices.
