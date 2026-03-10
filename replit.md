# MapAble 4.0 - NDIS Support Services Super App

## Overview
MapAble 4.0 is a full-stack superapp combining three core NDIS services:
- **MapAble for Care** - Book verified support workers/carers
- **MapAble for Transport** - Arrange wheelchair-accessible transport
- **MapAble for Employment** - Find disability support jobs
- **MapAble Chat** - AI-powered accessibility-context chatbot for journey planning and support
- **Pricing & Billing** - NDIS-aligned tiered pricing with automated invoicing
- **Budget Tracking** - Real-time NDIS plan budget monitoring

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn UI
- **Backend**: Express 5 + TypeScript
- **Database**: Neon PostgreSQL (serverless) with Drizzle ORM via `@neondatabase/serverless` driver
- **AI**: OpenAI (via Replit AI Integrations) with function calling + rules engine
- **Object Storage**: Replit App Storage (presigned URL upload flow)
- **Routing**: wouter (client-side)
- **State Management**: TanStack React Query

## Brand Identity
- **Brand**: Australian Disability Ltd / MapAble — tagline "Empowering Independence"
- **Logo**: `@assets/Accessible_Australia_Logo_Design_1772582762574.png`
- **Colors**: Primary blue #1B6EB5, teal green #2EAA6E (verified/success), golden yellow #E6A817 (accents)
- **CSS tokens**: `--map-teal`, `--map-navy`, `--map-gold` in index.css
- **Header**: Gradient blue bar (linear-gradient #14578F → #1B6EB5 → #2384C9)
- **Dark mode**: Deep navy #0F1A2E background

## Key Features
- Dashboard with hero section, stats, featured workers, and recent jobs
- Worker directory with search, filtering (verified/transport/accessible)
- Job board with category filters (Care/Transport/Support/Employment)
- Transport booking with wheelchair accessibility options
- Messaging system
- Settings with accessibility options (dark mode, high contrast, Easy Read mode)
- NDIS Worker Screening verification indicators
- Profile photo upload via object storage
- Audio-described logo dropdown navigation (Web Speech API)
- **Pricing page** — 4 care tiers + 4 transport tiers with NDIS compliance badges
- **Budget dashboard** — Category budgets with progress bars, tier indicators, activity log
- **Invoices page** — Generate NDIS-ready invoices with line items and NDIS support item codes
- **Reviews system** — Star ratings + comments on worker detail page
- **Verification checklist** — ABN, WWCC, First Aid, Insurance display on worker profiles
- **Shift management** — Start/End Shift timer on worker detail page, auto-creates care sessions
- **Trip logger** — Log transport trips on transport page with distance, tolls, accessible vehicle
- **Easy Read mode** — Toggle in Settings for larger text, more spacing, 44px min touch targets (WCAG 2.2)
- **High Contrast mode** — Toggle in Settings for stronger borders, bolder text, underlined links
- **Screen Reader Optimization** — Toggle in Settings to hide decorative elements, enhance focus outlines
- **WCAG 2.2 accessibility** — Skip-to-content link, aria-live regions, proper heading hierarchy
- **Dynamic page titles** — usePageTitle hook sets document.title per page for SEO
- **Error states** — All pages handle API errors with retry buttons
- **Hero search** — Dashboard hero search navigates to /care with query parameter
- **Contact messaging** — Messages page supports selecting contacts from worker list

## MapAble Chat (AI Chatbot)
- **Chat Engine**: `server/chat-engine.ts` — OpenAI function calling with tools for profile lookup, worker search, barrier reports, transport pricing, booking, and escalation
- **Rules Engine**: Safety layer that prevents suggesting stairs when profile says `stairs_allowed=false`, never exposes diagnosis data, always discloses confidence level
- **Access Profile**: User accessibility context (mobility aids, transfer distance, stairs capability, sensory preferences, communication mode, assistance needs)
- **Quick Action Chips**: Dynamic suggestions after AI responses — Book Transport, Report Barrier, View Workers, Get Human Help, Edit Profile, View Pricing
- **Confidence Badges**: High/Medium/Low/General confidence indicators on AI responses
- **Community Barrier Reports**: Users can report accessibility barriers (lift out, ramp blocked, path closed, etc.) with severity levels
- **Session Management**: Persistent chat sessions with history
- **Access Profile Wizard**: 3-step setup (Mobility → Sensory → Communication) accessible from chat page and settings
- **WCAG 2.2 AA**: 44px touch targets, aria-live for messages, keyboard navigable, screen reader compatible

## Pricing Engine
- **Care tiers**: Basic (1-10hrs, $70.23/hr), Standard (11-30hrs, $68/hr), High Support (31+hrs, $65/hr), Support Coordination ($100.14/hr)
- **Transport tiers**: Basic (1-100km, $0.99/km), Standard (101-300km, $0.90/km), High (301+km, $0.85/km), Accessible Vehicle ($2.76/km)
- Automatic tier calculation based on monthly usage
- NDIS item codes attached to all charges
- Budget usage tracking with low-budget alerts (>80%)

## UI Patterns
- Sidebar logo is a DropdownMenu trigger — clicking opens audio-described nav links
- Each nav link speaks description via Web Speech API on focus
- "Toggle Sidebar" item at bottom of dropdown preserves collapse/expand
- Golden "MapAble" brand text (#E6A817) in sidebar header
- Golden particle dots in sidebar footer
- Shadcn UI components with Inter font, softer border radii (--radius: 0.75rem)
- Never apply hover:bg-* to Buttons; use Shadcn variants and elevation utilities
- data-testid attributes on all interactive/display elements

## Object Storage
- Integration: `server/replit_integrations/object_storage/`
- Upload flow: POST /api/uploads/request-url (get presigned URL) → PUT to presigned URL
- Serve objects: GET /objects/* (middleware-based, Express 5 compatible)
- Client hook: `useUpload()` in `client/src/hooks/use-upload.ts`
- Worker photos: PATCH /api/workers/:id/photo
- User avatars: PATCH /api/users/:id/avatar

## Structure
```
client/src/
  App.tsx                 - Main app layout with sidebar, skip-to-content
  components/
    app-sidebar.tsx       - Navigation sidebar with audio-described dropdown
    theme-provider.tsx    - Dark/light theme management
    worker-card.tsx       - Worker profile card component
    job-card.tsx          - Job listing card component
    stat-card.tsx         - Statistics card component
    ObjectUploader.tsx    - Uppy-based file uploader component
    access-profile-wizard.tsx - 3-step accessibility profile setup wizard
    barrier-report-form.tsx   - Community barrier reporting modal
  hooks/
    use-upload.ts         - Presigned URL upload hook
    use-page-title.ts     - Dynamic document.title per page
  pages/
    dashboard.tsx         - Main dashboard with hero, stats, featured content
    care.tsx              - Support worker directory
    worker-detail.tsx     - Worker profile + booking + reviews + verification
    jobs.tsx              - Job board
    job-detail.tsx        - Job detail page
    transport.tsx         - Transport booking
    chat.tsx              - AI chatbot with session management, quick actions
    pricing.tsx           - NDIS-aligned pricing tables
    budget.tsx            - Budget dashboard with tier indicators
    invoices.tsx          - Invoice list + generation
    messages.tsx          - Messaging inbox
    settings.tsx          - User/accessibility settings with photo upload + access profile

server/
  index.ts               - Express server setup + seed
  routes.ts              - API routes (including pricing, billing, reviews, chat, access profile)
  storage.ts             - Database storage interface with pricing engine
  chat-engine.ts         - LLM orchestration + rules engine + tool implementations
  db.ts                  - Neon serverless database connection (uses NEON_DATABASE_URL, falls back to DATABASE_URL)
  seed.ts                - Seed data for demo (pricing tiers, budgets, sessions, reviews)
  replit_integrations/
    object_storage/       - Object storage service + routes
    chat/                 - Chat storage adapter (uses chatSessions/chatMessages tables)

shared/
  schema.ts              - Drizzle schema + Zod validation (17 tables)
```

## Database Tables
- users (id, username, password, fullName, email, role, location, avatar, ndisNumber, planStartDate, planEndDate, phoneNumber, etc.)
- workers (id, userId, title, specializations, hourlyRate, transport, photo, abn, insuranceExpiry, firstAidExpiry, wwccNumber, wwccExpiry, etc.)
- bookings (id, participantId, workerId, serviceType, date, status)
- jobs (id, title, description, location, jobType, salary, category)
- transport_requests (id, pickup, dropoff, date, wheelchairRequired, status)
- messages (id, senderId, receiverId, body, timestamp)
- pricing_tiers (id, serviceType, tierName, minUsage, maxUsage, rate, ndisCategory, ndisItemCode)
- service_sessions (id, workerId, participantId, actualHours, hourlyRate, tierApplied, totalCharge, status)
- transport_trips (id, workerId, participantId, distanceKm, perKmRate, tierApplied, totalCharge, status)
- invoices (id, participantId, periodStart, periodEnd, totalAmount, ndisClaimable, status, lineItems)
- reviews (id, participantId, workerId, rating, comment, createdAt)
- participant_budgets (id, participantId, category, totalAllocated, totalUsed, periodStart, periodEnd)
- access_context_profiles (id, userId, mobilityAids, maxTransferM, stairsAllowed, sensoryPreferences, communicationMode, assistancePreferences, consentScopes)
- chat_sessions (id, userId, title, startedAt, endedAt)
- chat_messages (id, sessionId, role, content, toolCalls, quickActions, confidence, createdAt)
- community_reports (id, reporterUserId, locationRef, barrierType, severity, description, photoUrl, moderationStatus, confidenceWeight, expiresAt)

## API Endpoints
- GET /api/me - Get current user (participant)
- PATCH /api/me - Update current user profile (fullName, email, location)
- GET/POST /api/workers - List/create workers
- GET /api/workers/:id - Get worker detail
- GET /api/workers/:id/reviews - Get reviews for worker
- PATCH /api/workers/:id/photo - Update worker photo
- GET/POST /api/bookings - List/create bookings
- GET/POST /api/jobs - List/create jobs
- GET/POST /api/transport - List/create transport requests
- GET/POST /api/messages - List/create messages
- PATCH /api/users/:id/avatar - Update user avatar
- GET /api/pricing/care - Care pricing tiers
- GET /api/pricing/transport - Transport pricing tiers
- GET /api/pricing/care/rate?participantId=X - Current care rate for participant
- GET /api/pricing/transport/rate?participantId=X - Current transport rate
- POST /api/sessions - Log care session (auto-calculates tier rate)
- GET /api/sessions?participantId=X - List sessions
- POST /api/trips - Log transport trip (auto-calculates tier rate)
- GET /api/trips?participantId=X - List trips
- POST /api/invoices/generate - Generate NDIS invoice for period
- GET /api/invoices?participantId=X - List invoices
- GET /api/budget?participantId=X - Budget summary with tier info
- POST /api/reviews - Submit review
- POST /api/uploads/request-url - Get presigned upload URL
- GET /objects/* - Serve stored objects
- GET /api/access-profile - Get current user's accessibility profile
- PUT /api/access-profile - Create/update accessibility profile
- POST /api/chat/sessions - Create new chat session
- GET /api/chat/sessions - List user's chat sessions
- GET /api/chat/sessions/:id/messages - Get messages for a session
- DELETE /api/chat/sessions/:id - Delete a chat session
- POST /api/chat/send - Send message and get AI response
- GET /api/community-reports - List barrier reports
- POST /api/community-reports - Submit a barrier report
