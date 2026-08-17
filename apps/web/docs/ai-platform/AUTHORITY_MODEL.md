# Authority model

Ceilings: `READ_ONLY_EXPLAIN`, `DRAFT_ONLY`, `SUGGEST_WITH_HUMAN_REVIEW`, `SUGGEST_WITH_PARTICIPANT_APPROVAL`, `DETERMINISTIC_EXECUTE_VIA_SERVICE`, `NO_OPERATIONAL_AUTHORITY`.

Prohibited autonomous actions are enumerated in `lib/ai/platform/types/authority.ts` (NDIS claims, payments, consent mutation, clinical decisions, emergency contact, hidden memory, etc.).

Model proposals are never approved merely because they exist — see human-review contracts.
