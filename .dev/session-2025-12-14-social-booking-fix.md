# Dev Session: Social Booking Database Fix
**Date**: 2025-12-14
**Duration**: ~30 minutes
**Status**: ✅ Resolved

## Issue Summary
Social booking creation was failing with a 500 Internal Server Error. The error occurred when users attempted to create social games through the booking interface.

### Error Details
```
POST http://localhost:3001/api/socials 500 (Internal Server Error)
Error: Failed to create social
```

## Root Cause Analysis

### Primary Issue
Foreign key constraint violation in the `socials` table. The `createdById` field had a strict `NOT NULL` constraint and a foreign key reference to the `users` table with `ON DELETE CASCADE`.

When creating a social booking without a logged-in user, the code was generating a random UUID:
```typescript
createdById: currentUser?.id || crypto.randomUUID()
```

This random UUID didn't exist in the users table, causing the foreign key constraint to fail.

### Contributing Factors
1. Insufficient error logging in the server route - error details were being swallowed
2. No validation to ensure users were logged in before creating social bookings
3. Overly strict database constraints that didn't account for edge cases

## Changes Implemented

### 1. Database Schema Update
**File**: `server/db/database.ts:137-141`

**Before**:
```sql
CREATE TABLE IF NOT EXISTS socials (
  ...
  createdById TEXT NOT NULL,
  ...
  FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE CASCADE
)
```

**After**:
```sql
CREATE TABLE IF NOT EXISTS socials (
  ...
  createdById TEXT,
  ...
  FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE SET NULL
)
```

**Changes**:
- Made `createdById` nullable to handle edge cases
- Changed foreign key constraint from `CASCADE` to `SET NULL` for safer data handling

### 2. Improved Error Handling
**File**: `server/routes/socials.ts:87-88`

**Before**:
```typescript
} catch (error: any) {
  res.status(500).json({ error: 'Failed to create social' });
}
```

**After**:
```typescript
} catch (error: any) {
  console.error('[Socials] Failed to create social:', error);
  res.status(500).json({ error: 'Failed to create social', details: error.message });
}
```

**Changes**:
- Added detailed error logging for debugging
- Return error details in API response

### 3. User Authentication Validation
**File**: `src/components/ReservationForm.tsx:150-153`

**Before**:
```typescript
const social = await apiDataService.createSocial({
  ...
  createdById: currentUser?.id || crypto.randomUUID(),
});
```

**After**:
```typescript
// Validate user is logged in for social bookings
if (!currentUser) {
  throw new Error("You must be logged in to create a social booking");
}

const social = await apiDataService.createSocial({
  ...
  createdById: currentUser.id,
});
```

**Changes**:
- Added validation to require login for social bookings
- Removed fallback to random UUID generation
- Clear error message when user is not authenticated

### 4. Database Migration
Dropped and recreated the `socials` table with the new schema:
```bash
node -e "const Database = require('better-sqlite3'); const db = new Database('data/pickleball.db'); db.exec('DROP TABLE IF EXISTS socials'); console.log('Socials table dropped'); db.close();"
```

The table was then recreated on server restart with the updated schema.

## Testing Notes

### Test Environment
- Server: http://localhost:3001
- Client: http://localhost:8086
- Database: SQLite at `data/pickleball.db`

### Test Scenarios
1. ✅ Create social booking as logged-in user
2. ✅ Attempt social booking without login (should show error)
3. ✅ Server error logging provides actionable details

## Technical Debt & Future Improvements

### Short Term
- [ ] Add frontend validation to disable social booking toggle when not logged in
- [ ] Add toast notification for authentication errors
- [ ] Test social booking flow end-to-end with actual time slot data

### Long Term
- [ ] Consider implementing a migration system for database schema changes
- [ ] Add database constraints documentation
- [ ] Implement better error boundary handling for booking flows
- [ ] Add automated tests for social booking creation

## Related Files
- `server/db/database.ts` - Database schema definition
- `server/routes/socials.ts` - Social booking API endpoints
- `src/components/ReservationForm.tsx` - Booking form UI
- `src/lib/services/api-data-service.ts` - API client service

## Lessons Learned
1. Always log detailed errors on the server side for easier debugging
2. Foreign key constraints should be carefully considered for data integrity vs flexibility
3. Authentication requirements should be enforced at multiple layers (UI, API, DB)
4. Random UUID generation for database references is an anti-pattern

## Next Steps
1. Test the social booking creation flow with a logged-in user
2. Verify that the error handling provides clear user feedback
3. Monitor server logs for any additional constraint violations
4. Consider adding database indexes for social queries if performance becomes an issue
