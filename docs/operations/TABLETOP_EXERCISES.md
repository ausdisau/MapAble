# Tabletop exercise template

**Rule:** All exercises remain `NOT_RUN` until a human records a completed run with date, facilitator, and outcomes. Never mark passed without evidence.

## Exercise log

| ID  | Scenario                                                           | Facilitator | Date | Environment   | Result | Evidence link | Status    |
| --- | ------------------------------------------------------------------ | ----------- | ---- | ------------- | ------ | ------------- | --------- |
| T1  | Neon snapshot / PITR → staging restore → schema verify → app smoke | —           | —    | staging clone | —      | —             | `NOT_RUN` |
| T2  | SEV-1 privacy breach communications                                | —           | —    | tabletop      | —      | —             | `NOT_RUN` |
| T3  | Safeguarding escalation (no autonomous decision)                   | —           | —    | tabletop      | —      | —             | `NOT_RUN` |
| T4  | Payment/claim incident boundary (flags stay off)                   | —           | —    | tabletop      | —      | —             | `NOT_RUN` |
| T5  | Auth outage + rollback authority                                   | —           | —    | tabletop      | —      | —             | `NOT_RUN` |
| T6  | Dependency outage (Neon / Vercel / messaging)                      | —           | —    | tabletop      | —      | —             | `NOT_RUN` |
| T7  | Application rollback (flag disable vs redeploy)                    | —           | —    | tabletop      | —      | —             | `NOT_RUN` |
| T8  | RTO / RPO measurement against stated objectives                    | —           | —    | staging clone | —      | —             | `NOT_RUN` |

## Evidence form fields (copy per run)

| Field                           | Value                     |
| ------------------------------- | ------------------------- |
| Scenario name and severity      |                           |
| Participants / roles            |                           |
| Inject timeline                 |                           |
| Decisions taken                 |                           |
| Observed RTO / RPO (if restore) |                           |
| Gaps found                      |                           |
| Corrective actions + owners     |                           |
| Ledger rows to update           |                           |
| Pass / fail / stop conditions   |                           |
| Status                          | `NOT_RUN` until completed |

## Related

- `docs/operations/BACKUP_RESTORE.md`
- `docs/operations/INCIDENT_RESPONSE.md`
- `docs/operations/STAGING_MIGRATION_REHEARSAL.md` (PR #382 pack)
