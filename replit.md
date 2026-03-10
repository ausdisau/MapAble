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
- Dashboard with hero search, stats, featured workers, recent jobs
- Worker directory with search, filtering (verified/transport/accessible)
- Worker detail with booking form, shift timer, reviews, verification checklist
- Job board with category filters (Care/Transport/Support/Employment)
- Transport booking with wheelchair options + trip logger with tier pricing
- AI chatbot with 7 tools, rules engine, quick actions, confidence badges
- NDIS pricing tiers (4 care + 4 transport) with automatic tier calculation
- Budget dashboard with category progress bars and tier indicators
- Invoice generation with NDIS line items and item codes
- Messaging system with contact sidebar
- Settings with profile editing, accessibility toggles, access profile wizard
- Dark mode toggle with cookie persistence
- WCAG 2.2 AA: 44px min touch targets, skip-to-content, ARIA landmarks

## Auth
- Demo accounts: `demo_participant` / `hashed_password` (Jordan Lee), `alex_m` / `hashed_password` (Alex Mehmet)
- Login POST to /login, redirect to dashboard
- All routes except /login require authentication
- Logout destroys session, redirects to /login

## Pricing Engine
- Care tiers: Basic (0-10hrs, $70.23/hr), Standard (11-30hrs, $68/hr), High Support (31+hrs, $65/hr)
- Transport tiers: Basic (0-100km, $0.99/km), Standard (101-300km, $0.90/km), High (301+km, $0.85/km)
- Accessible vehicle surcharge: +$0.15/km
- NDIS item codes on all charges
- Budget usage auto-updated on shift end and trip log
