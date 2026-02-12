import type pg from 'pg';

export interface ParsedTimeSlotId {
  courtId: string;
  date: string;
  hour: number;
  startTime: string;
  endTime: string;
}

/**
 * Parse a time slot ID to extract its components.
 * Format: courtId-YYYY-MM-DD-hour
 * Example: "court-1-2025-12-16-14" -> { courtId: "court-1", date: "2025-12-16", hour: 14, startTime: "14:00", endTime: "15:00" }
 */
export function parseTimeSlotId(timeSlotId: string): ParsedTimeSlotId | null {
  const parts = timeSlotId.split('-');
  if (parts.length < 5) return null;

  const hour = parseInt(parts[parts.length - 1]);
  const day = parts[parts.length - 2];
  const month = parts[parts.length - 3];
  const year = parts[parts.length - 4];
  const courtId = parts.slice(0, parts.length - 4).join('-');

  if (isNaN(hour) || year.length !== 4 || !courtId) {
    return null;
  }

  return {
    courtId,
    date: `${year}-${month}-${day}`,
    hour,
    startTime: `${hour.toString().padStart(2, '0')}:00`,
    endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
  };
}

export interface EnsureTimeSlotOptions {
  type?: string | null;
  startTime?: string;
  endTime?: string;
}

export interface EnsureTimeSlotResult {
  success: boolean;
  created: boolean;
  error?: string;
}

/**
 * Ensure a time slot exists in the database. If it doesn't exist, create it.
 * Accepts a pg.Pool or pg.PoolClient for use inside transactions.
 */
export async function ensureTimeSlotExists(
  client: { query: (text: string, params?: any[]) => Promise<pg.QueryResult> },
  timeSlotId: string,
  tenantId: string,
  options: EnsureTimeSlotOptions = {}
): Promise<EnsureTimeSlotResult> {
  const existing = await client.query('SELECT id FROM time_slots WHERE id = $1 AND tenant_id = $2', [timeSlotId, tenantId]);

  if (existing.rows.length > 0) {
    return { success: true, created: false };
  }

  const parsed = parseTimeSlotId(timeSlotId);
  if (!parsed) {
    return {
      success: false,
      created: false,
      error: `Invalid time slot ID format: ${timeSlotId}. Expected format: courtId-YYYY-MM-DD-hour`,
    };
  }

  const createdAt = new Date().toISOString();
  const startTime = options.startTime || parsed.startTime;
  const endTime = options.endTime || parsed.endTime;

  await client.query(
    `INSERT INTO time_slots (id, tenant_id, "courtId", date, "startTime", "endTime", available, blocked, type, "clinicId", comments, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, FALSE, FALSE, $7, NULL, '[]'::jsonb, $8, $8)`,
    [timeSlotId, tenantId, parsed.courtId, parsed.date, startTime, endTime, options.type || null, createdAt]
  );

  return { success: true, created: true };
}
