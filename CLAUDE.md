# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` - Starts both Vite client and Express server concurrently
- **Client only**: `npm run dev:client` - Vite dev server on port 8080
- **Server only**: `npm run dev:server` - Express API server on port 3001 with auto-restart
- **Build**: `npm run build` - Production build using Vite
- **Build (development)**: `npm run build:dev` - Development build using Vite
- **Lint**: `npm run lint` - Runs ESLint for code quality checks
- **Preview**: `npm run preview` - Preview production build locally

**Testing**: No test framework is configured. Manual testing via browser.

## Architecture Overview

This is a **React + TypeScript pickleball court booking application** with:
- **Frontend**: React 18 + Vite + TypeScript
- **Backend**: Express 5 + SQLite (better-sqlite3)
- **UI**: shadcn/ui components + Radix UI + Tailwind CSS
- **Validation**: Zod schemas for type safety
- **Forms**: React Hook Form with Zod resolvers
- **Routing**: React Router with HashRouter

### Data Flow (Canonical Pattern)

```
React Component
  -> useDataService() hook (from DataServiceContext)
    -> DataServiceContext (holds state, provides CRUD actions)
      -> apiDataService singleton (makes REST calls)
        -> Express server (port 3001)
          -> SQLite database (data/pickleball.db)
```

### Backend (server/)

- **Entry**: `server/index.ts` - Express app with CORS, routes, health check
- **Database**: `server/db/database.ts` - SQLite schema, migrations, seed data
- **Routes**: `server/routes/` - REST endpoints for each entity
  - `courts.ts`, `time-slots.ts`, `reservations.ts`, `users.ts`, `coaches.ts`, `clinics.ts`, `settings.ts`
- **Utilities**: `server/utils/time-slot-utils.ts` - Time slot ID parsing and creation

**Database Tables**: courts, users, coaches, time_slots, reservations, clinics, settings

### Frontend (src/)

**State Management**:
- **UserContext** (`src/contexts/UserContext.tsx`): User auth and session (localStorage persistence)
- **CoachContext** (`src/contexts/CoachContext.tsx`): Coach auth with server-side password verification
- **DataServiceContext** (`src/contexts/DataServiceContext.tsx`): Centralized data store + CRUD actions + API health check

**Provider Stack** (in `src/main.tsx`):
```
HashRouter > UserProvider > CoachProvider > DataServiceProvider > App
```

**Data Service** (`src/lib/services/api-data-service.ts`):
- Singleton REST client for all API calls
- Base URL: `http://localhost:3001/api`

**Key Entity Relationships**:
- **Courts** have multiple **TimeSlots** (1:many)
- **TimeSlots** can have **Reservations** or **Clinics** (1:1)
- **Clinics** are managed by **Coaches** and can have multiple participants
- **Users** can make reservations and join clinics

### Pages

- `src/pages/Index.tsx` - Main user booking interface
- `src/pages/Admin.tsx` - Admin dashboard
- `src/pages/CoachBooking.tsx` - Book private coaching
- `src/pages/CoachLogin.tsx` - Coach authentication
- `src/pages/CoachDashboard.tsx` - Coach portal

### Key Components

- **HomeSchedulerView**: Main scheduling grid with calendar/day/week views
- **CourtCalendar**: Calendar month view for court scheduling
- **AdminCalendarView**: Admin calendar with management actions
- **CourtTimeSlots**: Admin time slot overview with actions
- **ReservationForm**: Booking dialog with validation
- **AdminModalsController**: Orchestrates all admin modals

## Important Implementation Details

**Time Slot Management**:
- Time slots are dynamically generated based on operating hours settings
- Time slot IDs follow format: `courtId-YYYY-MM-DD-hour` (e.g., `court-1-2025-12-16-14`)
- Status types: `available`, `reserved`, `blocked`, `clinic`
- The `/api/time-slots/date/:date` endpoint returns enriched slots with embedded reservation/clinic data

**Reservation System**:
- Atomic transactions ensure time slot + reservation consistency
- Server-side validation of all required fields
- Participant management with organizer designation

**Authentication**:
- Users: Server-side SHA256 password hashing via `/api/users/login`
- Coaches: Server-side SHA256 password hashing via `/api/coaches/login`
- Sessions persisted via localStorage email keys
- No JWT/token-based auth (email-based session lookup)

**Form Patterns**:
- All forms use React Hook Form with Zod validation
- shadcn/ui form components with accessibility

## Development Notes

- Uses HashRouter for GitHub Pages compatibility
- Responsive design with mobile-first approach using Tailwind
- Error boundaries wrap Admin and CoachDashboard pages
- `getTimeSlotsForDate()` is called directly via apiDataService in components (not through context) since it returns date-specific enriched data
