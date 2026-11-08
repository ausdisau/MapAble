# NDIA reference and mapping status

- User-supplied link: https://www.ndis.gov.au/media/8038/download?attachment
- Checked: 2026-11-06.
- Link content type observed: `.xlsx` (Microsoft Excel workbook).
- **Important limitation:** The workbook bytes and worksheet contents were **not** successfully extracted in this environment. The workbook title, tabs, headings, row-level data and official data dictionary are **not verified**. This schema is **not claimed to be a translation of the linked workbook**. Do not represent it as an official NDIA data model.
- The schema instead reflects the current MapAble AURA x MAIRA design, established participant-first care principles and authoritative NDIA/Commission public guidance.

## Mapping plan after accessing the original workbook

1. Preserve the exact workbook hash, date, filename and document owner.
2. Enumerate all sheets, titles, rows, columns, data types and values; check hidden worksheets and notes.
3. Identify whether the file represents an individual assessment instrument, aggregate data, a provider catalogue, price limits or a different kind of source. **Do not assume** it is a participant-level assessment.
4. Map only justified source elements. For example, if support type/amount/frequency truly appear, map them to `perception.activities_and_support` with precise provenance and a clear distinction between assessment evidence and approved funding.
5. Add a versioned crosswalk with `source_sheet`, `source_column`, `source_cell_or_range`, `destination_json_pointer`, `transformation`, `authority`, `limitations`, `reviewer`.
6. Preserve unsupported workbook fields in a quarantined import staging structure rather than guessing a correspondence or dropping them silently.
7. Conduct legal and rights review before any personal data ingestion or model processing; maintain a provider/participant privacy boundary.

## Verified complementary policy sources

- NDIA legislation changes / support-needs assessments, including prospective rollout: https://www.ndis.gov.au/ndis-laws/getting-ndis-back-track/summary-legislation-changes
- NDIA supported decision-making policy: https://ndis.gov.au/policies-rules-and-legal/policy/supported-decision-making-policy
- NDIS Commission Practice Standards: https://www.ndiscommission.gov.au/rules-and-standards/ndis-practice-standards
- OpenAI Structured Outputs schema subset: https://developers.openai.com/api/docs/guides/structured-outputs