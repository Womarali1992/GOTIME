---
name: Fix Court Days Saving
overview: Fix the disconnection between where reservation settings (including open days) are saved vs read, and add localStorage persistence so changes survive page refresh.
todos:
  - id: sync-settings
    content: Sync DataService settings to module-level reservationSettings in data.ts
    status: pending
  - id: add-persistence
    content: Add localStorage persistence for reservation settings
    status: pending
---

# Fix Court Open Days Not Saving

## Problem

When editing operating hours (which days are open), the changes appear to save but don't take effect because:

1. **Settings are stored in two disconnected places**:

   - `DataService._reservationSettings` in [`src/lib/services/data-service.ts`](src/lib/services/data-service.ts) (where AdminSettings saves)
   - Module-level `reservationSettings` in [`src/lib/data.ts`](src/lib/data.ts) (where time slot generation reads)

2. **No persistence** - settings reset on page refresh since they're only in memory

## Solution

### 1. Synchronize the settings sources

Modify [`src/lib/services/data-service.ts`](src/lib/services/data-service.ts) `updateReservationSettings()` to also update the module-level settings in `data.ts`:

```typescript
updateReservationSettings(newSettings: Partial<ReservationSettings>): ReservationSettings {
  this._reservationSettings = {
    ...this._reservationSettings,
    ...newSettings,
    updatedAt: new Date().toISOString(),
  };
  // Sync to module-level settings used by time slot generation
  Object.assign(reservationSettings, this._reservationSettings);
  return { ...this._reservationSettings };
}
```

### 2. Add localStorage persistence

Store settings in localStorage and load them on initialization:

- Save to localStorage when `updateReservationSettings()` is called
- Load from localStorage in `DataService` constructor
- Use a storage key like `'picklepop_reservation_settings'`

### Files to modify

- [`src/lib/services/data-service.ts`](src/lib/services/data-service.ts) - Sync settings and add persistence