# MapAble 4.0 - NDIS Support Services Super App

## Overview
MapAble 4.0 is a full-stack superapp combining three core NDIS services:
- **MapAble for Care** - Book verified support workers/carers
- **MapAble for Transport** - Arrange wheelchair-accessible transport
- **MapAble for Employment** - Find disability support jobs

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn UI
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: wouter (client-side)
- **State Management**: TanStack React Query

## Brand Identity
- **Brand**: Australian Disability Ltd / MapAble — tagline "Empowering Independence"
- **Logo**: `@assets/Accessible_Australia_Logo_Design_1772582762574.png`
- **Colors**: Primary blue #1B6EB5, teal green #2EAA6E (verified/success), golden yellow #E6A817 (accents)
- **Header**: Gradient blue bar (linear-gradient #14578F → #1B6EB5 → #2384C9)
- **Dark mode**: Deep navy #0F1A2E background

## Key Features
- Dashboard with hero section, stats, featured workers, and recent jobs
- Worker directory with search, filtering (verified/transport/accessible)
- Job board with category filters (Care/Transport/Support/Employment)
- Transport booking with wheelchair accessibility options
- Messaging system
- Settings with accessibility options (dark mode, high contrast)
- NDIS Worker Screening verification indicators

## UI Patterns
- Sidebar is collapsible to icon-only rail; the MapAble logo in the sidebar header acts as the toggle button
- Shadcn UI components with Inter font, softer border radii (--radius: 0.75rem), real visible shadows
- Never apply hover:bg-* to Buttons; use Shadcn variants and elevation utilities
- data-testid attributes on all interactive/display elements

## Structure
```
client/src/
  App.tsx                 - Main app layout with sidebar
  components/
    app-sidebar.tsx       - Navigation sidebar
    theme-provider.tsx    - Dark/light theme management
    worker-card.tsx       - Worker profile card component
    job-card.tsx          - Job listing card component
    stat-card.tsx         - Statistics card component
  pages/
    dashboard.tsx         - Main dashboard with hero, stats, featured content
    care.tsx              - Support worker directory
    worker-detail.tsx     - Worker profile detail + booking form
    jobs.tsx              - Job board
    job-detail.tsx        - Job detail page
    transport.tsx         - Transport booking
    messages.tsx          - Messaging inbox
    settings.tsx          - User/accessibility settings

server/
  index.ts               - Express server setup + seed
  routes.ts              - API routes
  storage.ts             - Database storage interface
  db.ts                  - Database connection
  seed.ts                - Seed data for demo

shared/
  schema.ts              - Drizzle schema + Zod validation
```

## Database Tables
- users (id, username, password, fullName, email, role, location, etc.)
- workers (id, userId, title, specializations, hourlyRate, transport, etc.)
- bookings (id, participantId, workerId, serviceType, date, status)
- jobs (id, title, description, location, jobType, salary, category)
- transport_requests (id, pickup, dropoff, date, wheelchairRequired, status)
- messages (id, senderId, receiverId, body, timestamp)

## API Endpoints
- GET/POST /api/workers - List/create workers
- GET/POST /api/bookings - List/create bookings
- GET/POST /api/jobs - List/create jobs
- GET/POST /api/transport - List/create transport requests
- GET/POST /api/messages - List/create messages
