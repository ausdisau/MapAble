# SEO and AEO baseline

MapAble public content should be optimised for search engines and AI answer
engines without overstating compliance, registration, hosting or funding claims.

## Current technical baseline

- Root metadata is defined in `app/layout.tsx`.
- `app/sitemap.ts` exposes `/sitemap.xml` for public routes.
- `app/robots.ts` exposes `/robots.txt` and blocks authenticated/admin/API
  surfaces.
- Organisation and WebSite JSON-LD are emitted from the root layout.
- Canonical host should be `https://www.mapable.com.au`.

## Claim safety

Do not publish these as confirmed unless evidence is available:

- NDIS registration status.
- WCAG conformance.
- Australian data sovereignty.
- NDIS funding eligibility or claim approval.
- Legal/DDA compliance for access reviews.

Preferred wording:

- "Built for the NDIS ecosystem."
- "Designed toward WCAG 2.2 AA accessibility."
- "Data hosting and privacy controls under review."
- "Claimable estimate only, subject to plan, service agreement and review."

## EEAT guidance

Public resource pages should identify:

- who the content is for;
- what is available now;
- what is coming soon;
- privacy and safety caveats;
- how to contact MapAble for corrections or support.

## Structured data candidates

Use JSON-LD where content is stable and public:

- `Organization` for MapAble.
- `WebSite` with provider-finder search action.
- `FAQPage` for Help/Resources when FAQs are written as explicit question and
  answer pairs.
- `BreadcrumbList` for deeper public resource pages.

Avoid structured data for unverified product, review, accreditation or medical
claims until the underlying evidence and governance model are complete.

## AEO considerations

- Use plain-language headings that answer common participant/provider questions.
- Keep policy pages concise and date-aware.
- Make safety boundaries explicit.
- Avoid hiding critical caveats inside footnotes.
- Ensure robots/sitemap expose public resources but not sensitive dashboards.
