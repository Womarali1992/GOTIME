# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` - Starts Vite development server with hot reload
- **Build**: `npm run build` - Production build using Vite
- **Build (development)**: `npm run build:dev` - Development build using Vite
- **Lint**: `npm run lint` - Runs ESLint for code quality checks
- **Preview**: `npm run preview` - Preview production build locally

**Testing**: No test framework is configured. Manual testing can be done using browser console with scripts like `test-clinic-creation.js`.

## Architecture Overview

This is a **React + TypeScript pickleball court booking application** built with:
- **Vite** for build tooling and development
- **React Router** with HashRouter for client-side routing  
- **shadcn/ui** components with Radix UI primitives
- **Tailwind CSS** for styling
- **Zod** schemas for validation and type safety
- **React Hook Form** with Zod resolvers for form handling

### Core Application Structure

**Data Layer Architecture**:
- **Repository Pattern**: Base repositories (`src/lib/repositories/`) handle data persistence for each entity
- **Service Layer**: Business logic services (`src/lib/services/`) orchestrate operations between repositories
- **Centralized Data Service**: `dataService` singleton provides unified access to all services
- **Type Safety**: All data models defined in `src/lib/validation/schemas.ts` with Zod validation

**State Management**:
- **UserContext** (`src/contexts/UserContext.tsx`): User authentication and session management
- **DataProvider** (`src/components/DataProvider.tsx`): Initializes data services on app startup
- **Local data simulation**: Mock data in `src/lib/data.ts` simulates a backend

**Key Entity Relationships**:
- **Courts** have multiple **TimeSlots** (1:many)
- **TimeSlots** can have **Reservations** or **Clinics** (1:1)
- **Clinics** are managed by **Coaches** and can have multiple participants
- **Users** can make reservations and join clinics

### Component Architecture

**Page Structure**:
- `src/pages/Index.tsx` - Main user booking interface
- `src/pages/Admin.tsx` - Admin dashboard with comprehensive management tools
- Router configuration in `src/App.tsx`

**Key Components**:
- **CourtCalendar**: Main calendar interface for court scheduling
- **AdminCalendarView**: Admin-specific calendar with management capabilities  
- **TimeSlot components**: Handle slot availability, booking, and status display
- **Form components**: Standardized forms using shadcn/ui with Zod validation
- **DataProvider**: Wraps app with data initialization

### Data Consistency System

The application maintains data integrity through:
- **Automatic consistency checks** on data service initialization
- **Time slot status validation** (available/reserved/blocked/clinic)
- **Orphaned data cleanup** (reservations without time slots)
- **Status synchronization** between time slots and reservations

## Important Implementation Details

**Time Slot Management**:
- Time slots are dynamically generated based on operating hours settings
- Status types: `available`, `reserved`, `blocked`, `clinic`
- Clinic slots remain "available" (bookable) but show as clinic type
- Blocked slots cannot be booked or converted to clinics

**Reservation System**:
- Supports both individual reservations and clinic participation
- Participant management with organizer designation
- Comment system for reservations, users, and time slots

**Form Patterns**:
- All forms use React Hook Form with Zod validation
- Consistent error handling and user feedback
- shadcn/ui form components with proper accessibility

**Admin Features**:
- Comprehensive user, coach, clinic, and reservation management
- Court scheduling and time slot blocking capabilities
- Real-time status updates and data integrity monitoring

## Development Notes

- Uses HashRouter for GitHub Pages compatibility
- Mock data includes sample courts, users, reservations, and clinics
- Responsive design with mobile-first approach using Tailwind
- Error boundaries wrap critical application sections
- Local storage used for user session persistence

## Data Storage

**Local Storage Architecture**:
- All data persists in browser local storage (no backend)
- Data structure follows the repository/service pattern for scalability
- Automatic data migration and consistency checks on app load
- Data is structured with separate stores for: courts, users, coaches, time-slots, reservations, clinics