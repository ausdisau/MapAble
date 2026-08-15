# Azure DevOps Import Strategy — MapAble Innovation Portfolio

**Status:** Import-ready representation only — **no work items created in this pass**  
**Reason:** `AZURE_DEVOPS_PAT` and `AZURE_DEVOPS_ORG` are unset in the agent environment.

---

## Hierarchy

```
Epic (15)
 └── Feature (7 stage-gate + 4–8 product per Epic ≈ 180 Features total)
      └── User Story / PBI (future — not generated in this pass)
           └── Task (future)
                └── Test / Evidence (future)
```

Structured source: [azure-devops-portfolio.json](./azure-devops-portfolio.json)

---

## Idempotent create strategy

### 1. Search before create

For each Epic and Feature, query Azure DevOps before creation:

```
WIQL: SELECT [System.Id], [System.Title], [System.State]
      FROM workitems
      WHERE [System.TeamProject] = 'MapAble'
        AND [System.WorkItemType] IN ('Epic','Feature')
        AND [Custom.ProgrammeKey] = '{key}'
```

**Recommended custom field:** `ProgrammeKey` (or tag `mapable-portfolio-v1`) storing the stable key from JSON (e.g. `mapable-epic-01-access-graph`).

If a match exists → **update** title/description/tags only; do **not** duplicate.

### 2. Creation order

1. Create Epics in wave order (E01, E02, E09, E06, …)
2. Create stage-gate Features G0→G6 under each Epic
3. Create product Features under each Epic
4. Add **Predecessor** links for cross-Epic dependencies from JSON `dependencies` array
5. Chain gate Features sequentially within each Epic

### 3. Field mapping

| JSON field | Azure DevOps field |
|------------|-------------------|
| `key` | Custom.ProgrammeKey or Tag |
| `title` | System.Title |
| `priority` | Microsoft.VSTS.Common.Priority (P0=1, P1=2, P2=3, P3=4) |
| `horizon` | Custom.DeliveryHorizon or Tag |
| `dependencies[]` | Predecessor link to other Epic keys |
| Feature `classification` | Custom.ReuseClassification |
| Feature `type` | Tag `stage-gate` or `product` |

### 4. Epic descriptions

Link each Epic description to markdown spec:

```
docs/innovation/epics/{num}-{slug}.md
```

Use Azure DevOps description HTML with link to repo path.

### 5. Tags (recommended)

- `mapable-innovation-portfolio`
- `wave-foundation` | `wave-experience` | `wave-intelligence` | `wave-participation` | `wave-commercialisation` | `wave-rd`
- `claim-in-development` (update when claim state changes)

---

## Validation checklist (before ADO write)

- [ ] No duplicate ProgrammeKey in project
- [ ] All 15 Epics present with 7 gate Features each
- [ ] Cross-Epic dependencies match [PORTFOLIO_DEPENDENCY_MAP.md](./PORTFOLIO_DEPENDENCY_MAP.md)
- [ ] Ownership assigned (see Epic §39)
- [ ] No Tasks/Stories bulk-created in this pass
- [ ] Portfolio reviewed by Product + DRO representative for G1 readiness on Foundation wave

---

## Import options

### Option A — Manual import

1. Review markdown specs in `docs/innovation/epics/`
2. Create Epics using JSON titles and keys
3. Bulk-add Features from JSON `features` arrays

### Option B — Azure DevOps CLI / REST script (future)

```bash
# Pseudocode — run only after credentials configured
for epic in $(jq -r '.epics[].key' azure-devops-portfolio.json); do
  az boards work-item show --id $(search-by-programme-key $epic) || \
  az boards work-item create --type Epic --title "..." --fields ProgrammeKey=$epic
done
```

### Option C — CSV import

Export JSON to CSV with columns: Work Item Type, Title, ProgrammeKey, Parent Key, Classification, Horizon.

---

## Items deliberately NOT created

| Item type | Count | Reason |
|-----------|-------|--------|
| Epic | 15 | Awaiting portfolio validation + ADO credentials |
| Feature | ~180 | Same |
| User Story / PBI | 0 | Out of scope for this pass |
| Task | 0 | Out of scope per mission §6 |
| Test work items | 0 | Linked at Story level later |

---

## After import — record template

| ProgrammeKey | ADO ID | URL | State | Parent |
|--------------|--------|-----|-------|--------|
| mapable-epic-01-access-graph | TBD | TBD | New | — |

Fill this table in a follow-up commit after authorised ADO creation.

---

## Related documents

- [MAPABLE_INNOVATION_PORTFOLIO.md](./MAPABLE_INNOVATION_PORTFOLIO.md)
- [PORTFOLIO_STAGE_GATES.md](./PORTFOLIO_STAGE_GATES.md)
- [PORTFOLIO_ROADMAP.md](./PORTFOLIO_ROADMAP.md)
