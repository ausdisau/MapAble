# Publication workflow

## States

`draft` → `in_review` → `approved` → `published` | `changes_requested` | `rejected` | `archived` | `superseded`

Implemented in `lib/indoor-accessibility/publication/state-machine.ts` and `floor-plan-authoring-service.ts`.

## Rules

- Published versions are immutable.
- Editing a published plan creates a new draft version (via new row / version increment).
- Publishing supersedes prior published version with same floor code.
- Every transition records an audit event.
- Restricted venues require additional approval (enforced via permissions).

## Reviewer responsibilities

- Reviewer cannot be sole approver for high-risk venues they authored (separation of duties via role checks).
- Validation before submit: alt text, asset, source, permission basis, valid coordinates.
