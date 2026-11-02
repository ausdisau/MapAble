# NDIS Commission registered-provider CSV: separate versioned import

**Status:** draft implementation; no real Commission CSV imported or published. Official source: https://www.ndiscommission.gov.au/provider-registration/find-registered-provider/download-csv .

**Scope:** NDIS Commission *provider register Part 1* only. Do not conflate with NDIA Provider Finder outlets, Commission compliance/enforcement Part 2, special SIL transition CSV files, ABR identity evidence or private worker screening database. Regulatory registration is not proof of worker competence, support availability, accessibility, care quality or NDIS funding.

## Source and uncertainty
- The download is published as CSV. Direct file bytes could not be retrieved through the present tool environment. **Actual headings, number of rows, encoding, date fields and update frequency have not been validated.**
- Run \`pnpm exec tsx scripts/ndis-commission-csv.ts --mode inspect --file /trusted/provider-register.csv\`; inspect exact header output; produce an operator-reviewed JSON column map, for example \`{"registrationId":"<actual column>","legalName":"<actual column>","abn":"<actual column>","status":"<actual column>"}\`. Names in angle brackets are placeholders, NOT confirmed columns.
- Run \`--mode preview --file /trusted/provider-register.csv --map /trusted/column-map.json\`. No DB writes. Unknown statuses, non-unique registration IDs and rejected records stop staging.
- Stage via separate protected Node runner with \`NDIS_COMMISSION_CSV_WRITES_ENABLED=true\`: \`--mode stage --file FILE --map MAP --sha256 EXACT_PREVIEW_HASH --operator OPERATOR\`.
- Confirm source date independently from Commission page/export metadata. Stage is immutable; publication requires a second human decision using \`--mode publish --run-id UUID --sha256 HASH --previous-run none --source-date YYYY-MM-DD --operator OPERATOR --confirm-publish\`. Publication pointer CAS and serialisable transaction protect against stale competing updates. No auto-activation, downloads from arbitrary URLs, web upload or automatic nightly overwrite.
- Treat an "Approved" status as **approved in this source snapshot only**. Suspension/revocation and expiration remain separate. Absence from the CSV is NOT a conclusive finding about any provider.
- Exact ABN matching may connect a Commission registration record to an NDIA provider organisation, but must not merge across multiple registration IDs or assume a local outlet has Commission authorisation. No name-only authoritative joins.
- Archive provenance (SHA-256, original official URL, explicit retrieval date, mapped headers, operator-reviewed source effective date, counts and rejected records). Do not expose raw files to agents or participant-facing UI.
- Planned: version-controlled integration against a genuine CSV and full disposable PostgreSQL CI, then separate admin read adapter. No claim of current register verification until those pass.

**Release:** HOLD publication and live matching pending real-source format confirmation, security/privacy review and human approval. Retain prior approved snapshot if a new download is blocked or materially different.
