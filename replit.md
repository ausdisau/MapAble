# MapAble 4.0 - NDIS Support Services Super App

## Overview
MapAble 4.0 is a full-stack superapp combining three core NDIS services:
- **MapAble for Care** - Book verified support workers/carers
- **MapAble for Transport** - Arrange wheelchair-accessible transport
- **MapAble for Employment** - Find disability support jobs

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn UI
- **Backend**: Express 5 + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
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
- Settings with accessibility options (dark mode, high contrast)
- NDIS Worker Screening verification indicators
- Profile photo upload via object storage
- Audio-described logo dropdown navigation (Web Speech API)

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
  App.tsx                 - Main app layout with sidebar
  components/
    app-sidebar.tsx       - Navigation sidebar with audio-described dropdown
    theme-provider.tsx    - Dark/light theme management
    worker-card.tsx       - Worker profile card component
    job-card.tsx          - Job listing card component
    stat-card.tsx         - Statistics card component
    ObjectUploader.tsx    - Uppy-based file uploader component
  hooks/
    use-upload.ts         - Presigned URL upload hook
  pages/
    dashboard.tsx         - Main dashboard with hero, stats, featured content
    care.tsx              - Support worker directory
    worker-detail.tsx     - Worker profile detail + booking form
    jobs.tsx              - Job board
    job-detail.tsx        - Job detail page
    transport.tsx         - Transport booking
    messages.tsx          - Messaging inbox
    settings.tsx          - User/accessibility settings with photo upload

server/
  index.ts               - Express server setup + seed
  routes.ts              - API routes
  storage.ts             - Database storage interface
  db.ts                  - Database connection
  seed.ts                - Seed data for demo
  replit_integrations/
    object_storage/       - Object storage service + routes

shared/
  schema.ts              - Drizzle schema + Zod validation
```

## Database Tables
- users (id, username, password, fullName, email, role, location, avatar, etc.)
- workers (id, userId, title, specializations, hourlyRate, transport, photo, etc.)
- bookings (id, participantId, workerId, serviceType, date, status)
- jobs (id, title, description, location, jobType, salary, category)
- transport_requests (id, pickup, dropoff, date, wheelchairRequired, status)
- messages (id, senderId, receiverId, body, timestamp)

## API Endpoints
- GET /api/me - Get current user (participant)
- GET/POST /api/workers - List/create workers
- PATCH /api/workers/:id/photo - Update worker photo
- GET/POST /api/bookings - List/create bookings
- GET/POST /api/jobs - List/create jobs
- GET/POST /api/transport - List/create transport requests
- GET/POST /api/messages - List/create messages
- PATCH /api/users/:id/avatar - Update user avatar
- POST /api/uploads/request-url - Get presigned upload URL
- GET /objects/* - Serve stored objects
