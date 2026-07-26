# MapAble Core UI

Shared shell, navigation and hub for the MapAble Core platform.

## Routes

| Route | Layout | Purpose |
|-------|--------|---------|
| `/core` | `CoreShell` | Platform hub — links to dashboard, civic pages and portals |
| `/login` | `CoreShell` | Sign-in |
| Public civic pages | `(core)` route group + `CoreShell` | Transparency, accountability, algorithms, etc. |
| `/data-vault`, `/academy`, `/assessor` | `CoreShell` | Authenticated portals with public chrome |
| `/provider` | `PortalNav` | Provider control panel — org metrics, onboarding status, quick links |
| `/provider/(console)/*` | `PortalNav` | Authenticated provider console (care, transport, workers, claiming, insights) |
| `/provider/[slug]` | Public `ProviderLayout` | Legacy marketplace directory profile (no auth shell) |
| `/enterprise-provider` | Redirect | → `/provider#enterprise-workspace` |
| `/provider-admin` | Redirect | → `/provider` (legacy directory admin home) |
| `/provider-admin/[providerId]` | Standalone | Legacy directory editing for `Provider` model |
| `/dashboard`, `/admin` | `DashboardNav` + skip link | Participant control panel (billing centre, safety centre) and admin |

## Components (`components/core/`)

- `CoreShell` — header, footer, skip link, main landmark
- `CoreHeader` / `CoreFooter` — global navigation
- `CorePageHeader` — page title block
- `CoreHubCard` — hub grid cards
- `PortalNav` — provider-style secondary nav

## Configuration

`lib/platform/core-ui/navigation.ts` — civic links, hub sections  
`lib/platform/core-ui/provider-nav.ts` — provider console links (control panel first)

Provider admins and transport operators land on `/provider` after sign-in (`defaultDashboardPath` in `lib/auth/roles.ts`). The control panel aggregates worker roster counts, pending invites, care inbox volume, roster gaps, and onboarding blockers via `lib/provider/provider-control-panel-service.ts`.

Users with `enterprise:console` see an **Enterprise workspace** section on the control panel (`#enterprise-workspace`). `/enterprise-provider` redirects there.

**Consolidated nav** (`lib/platform/core-ui/provider-nav.ts`): nine section hubs (control panel, care, transport, workers, calendar, bookings, claiming, billing, insights). Care and transport use sub-nav (`lib/platform/core-ui/provider-section-nav.ts`). Stub routes redirect: `scheduling`/`availability` → calendar; `invoices`/`documents` → billing; `messages` → notifications; `support` → safety; `workers/new` → `workers?invite=1`; `care` → inbox.

## Accessibility

- Skip to main content on dashboard, admin and public shell
- Focus-visible rings on interactive elements
- Minimum 40px touch targets on primary nav links
