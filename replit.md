# MapAble 4.0 - NDIS Support Services Super App

## Overview
MapAble 4.0 is a PHP superapp combining core NDIS services:
- **MapAble for Care** - Book verified support workers/carers
- **MapAble for Transport** - Arrange wheelchair-accessible transport
- **MapAble for Employment** - Find disability support jobs
- **MapAble Chat** - AI-powered accessibility-context chatbot
- **Pricing & Billing** - NDIS-aligned tiered pricing with automated invoicing
- **Budget Tracking** - Real-time NDIS plan budget monitoring

## Architecture
- **Runtime**: PHP 8.4 (built-in dev server)
- **Database**: Neon PostgreSQL (serverless) via PDO
- **AI**: OpenAI (via Replit AI Integrations) with function calling + rules engine via cURL
- **Styling**: Tailwind CSS via CDN + custom CSS
- **Auth**: Native PHP sessions with login/logout guard
- **Routing**: Front controller pattern (public/index.php routes all requests)
- **Icons**: Lucide icons via CDN

## Brand Identity
- **Brand**: Australian Disability Ltd / MapAble — tagline "Empowering Independence"
- **Logo**: `php/public/assets/images/logo.png`
- **Colors**: Primary blue #1B6EB5, teal green #2EAA6E (verified/success), golden yellow #E6A817 (accents)
- **Header**: Gradient blue bar (linear-gradient #14578F → #1B6EB5 → #2384C9)
- **Dark mode**: Deep navy #0F1A2E background

## Running the Project
- **Workflow**: `php -S 0.0.0.0:5000 -t php/public`
- **Dev server**: PHP built-in server on port 5000
- **Seed data**: `php php/seed.php` (skips if data exists)

## Environment Variables
- `NEON_DATABASE_URL` — Neon PostgreSQL connection string (primary)
- `DATABASE_URL` — Fallback database URL
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key (via Replit integrations)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI base URL (via Replit integrations)
- `SESSION_SECRET` — Session secret key
- `AUTH0_DOMAIN` — Auth0 tenant domain (default: `adid.au.auth0.com`)
- `AUTH0_CLIENT_ID` — Auth0 application Client ID (SPA type)

## Project Structure
```
php/
  public/
    index.php              - Front controller (routes all requests)
    assets/
      css/style.css        - Custom styles (cards, badges, chat bubbles)
      js/app.js            - Theme toggle, speech, search
      js/chat.js           - AJAX-driven chat UI
      images/logo.png      - Brand logo
  includes/
    config.php             - PDO/Neon connection, session, env vars
    auth.php               - Login/logout/session guard functions
    db.php                 - Database helper functions (all CRUD)
    layout_header.php      - HTML head, sidebar, header bar
    layout_footer.php      - Footer, scripts, toast messages
    helpers.php            - Sanitize, format currency, CSRF, etc.
  pages/
    login.php              - Login page (gradient, demo accounts)
    dashboard.php          - Dashboard (hero, stats, featured workers/jobs)
    care.php               - Worker directory (search, filters)
    worker_detail.php      - Worker profile + booking + reviews + shift timer
    jobs.php               - Job board (category filters)
    job_detail.php         - Job detail page
    transport.php          - Transport booking + trip logger
    chat.php               - AI chatbot UI
    pricing.php            - NDIS pricing tier cards
    budget.php             - Budget progress bars + tier info
    invoices.php           - Invoice generation + list
    messages.php           - Messaging with contact sidebar
    settings.php           - Profile, accessibility, access profile
    not_found.php          - 404 page
  api/
    chat_engine.php        - OpenAI integration + rules engine + tools
    chat_api.php           - AJAX endpoints for chat
  seed.php                 - Seed demo data (7 users, 5 workers, 5 jobs)
```

## Database Tables (17)
- users, workers, bookings, jobs, transport_requests, messages
- pricing_tiers, service_sessions, transport_trips
- invoices, reviews, participant_budgets
- access_context_profiles, chat_sessions, chat_messages
- community_reports

## Key Features
- **Landing page** (pre-login) at `/` — hero section, 6 service cards, features showcase, AI assistant preview, CTA, footer with brand tri-colour bar; unauthenticated users see landing, authenticated see dashboard
- Dashboard with hero search, stats, featured workers, recent jobs
- Worker directory with search, filtering (verified/transport/accessible)
- Worker detail with booking form, shift timer, reviews, verification checklist
- Job board with category filters (Care/Transport/Support/Employment)
- Transport booking with wheelchair options + trip logger with tier pricing
- **MapAble Assistant** — agentic AI with 17 tools, autonomous multi-step reasoning, voice recognition (Web Speech API), predictive text (OpenAI-powered), markdown rendering, confidence badges, and agent activity tracking
  - Voice input: Web Speech API with continuous recognition, en-AU locale, visual feedback
  - Predictive text: debounced API calls, NDIS-context-aware completions, Tab/Enter to accept, arrow keys to navigate
  - Agent tools: user profile, care workers, worker details, transport workers, budget, care pricing, transport pricing, jobs, job details, bookings, care sessions, transport trips, invoices, barrier reports, submit barrier, book transport, escalate to human
  - Prediction API: `POST /api/chat/predict` with `{text, session_id}`
- NDIS pricing tiers (4 care + 4 transport) with automatic tier calculation
- Budget dashboard with category progress bars and tier indicators
- Invoice generation with NDIS line items and item codes
- Messaging system with contact sidebar
- Settings with profile editing, accessibility toggles, access profile wizard
- Dark mode toggle with cookie persistence
- **WCAG 2.2 AA / W3C / WAVE accessibility**:
  - Skip links: 3 skip links (main content, navigation, search) on authenticated pages; section-based skip links on landing and login
  - ARIA landmarks: `banner`, `main`, `navigation`, `complementary`, `contentinfo`, `search`, `log`, `status`, `alert` across all pages
  - `aria-current="page"` on active nav item, `aria-expanded` on toggleable menus, `aria-pressed` on toggle buttons
  - `aria-live="polite"` on chat messages + announcer, `aria-live="assertive"` on toast/alert regions
  - `aria-hidden="true"` on all decorative elements (icons, gradients, tri-colour bars, background orbs)
  - `aria-labelledby` linking sections to their headings, `aria-describedby` on forms with errors
  - `role="listbox"` + `role="option"` + `aria-selected` on prediction dropdown
  - `aria-autocomplete="list"` + `aria-haspopup="listbox"` on chat input
  - `role="alert"` on login error messages, `role="status"` on speech status
  - Audio description buttons (TTS via Web Speech API) on landing page and login page
  - `#a11y-announcer` live region for dynamic state changes (theme toggle, menu open/close, voice state)
  - `focus-visible` outlines (3px solid blue, 2px offset) for keyboard navigation
  - `prefers-reduced-motion`: disables all animations/transitions
  - `prefers-contrast: more`: thicker borders on cards, badges, buttons, inputs
  - 44px minimum touch targets on all interactive elements
  - Proper form labels with `for`/`id` binding, `aria-required` on required fields
  - Escape key closes mobile menu and returns focus to trigger

## Auth
- **Auth0 federated login**: Domain `adid.au.auth0.com`, Client ID via `AUTH0_CLIENT_ID` env var
  - SPA-type app with PKCE (no client secret needed)
  - Routes: `/auth/login` (Universal Login), `/auth/login/google`, `/auth/login/microsoft`, `/auth/callback`
  - Federated logout: `/logout` → destroys session + redirects to Auth0 `/v2/logout`
  - User matching: auth0_sub column → email fallback → auto-create new user
  - Auth0 dashboard must have Callback URL and Logout URL configured
- Demo accounts: `demo_participant` / `hashed_password` (Jordan Lee), `alex_m` / `hashed_password` (Alex Mehmet)
- Login POST to /login, redirect to dashboard
- All routes except /login require authentication
- Logout destroys session; if Auth0 login, also signs out of Auth0

## Pricing Engine
- Care tiers: Basic (0-10hrs, $70.23/hr), Standard (11-30hrs, $68/hr), High Support (31+hrs, $65/hr)
- Transport tiers: Basic (0-100km, $0.99/km), Standard (101-300km, $0.90/km), High (301+km, $0.85/km)
- Accessible vehicle surcharge: +$0.15/km
- NDIS item codes on all charges
- Budget usage auto-updated on shift end and trip log
