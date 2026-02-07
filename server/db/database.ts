import pg from 'pg';
import dotenv from 'dotenv';
import { DEFAULT_OPERATING_HOURS } from '../utils/defaults.js';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/picklepop',
});

/** Run a parameterized query ($1, $2, …) */
export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

/** Get a client from the pool (for transactions) */
export async function getClient() {
  return pool.connect();
}

/**
 * Safely parse a value that might be a JSON string OR already a parsed object (JSONB).
 * pg returns JSONB columns as parsed objects, so JSON.parse() on them would crash.
 */
export function safeParseJSON(value: any, fallback: any = []): any {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value; // already parsed (JSONB)
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function initializeDatabase() {
  console.log('Initializing PostgreSQL database...');

  // Tenants table (must be created first — other tables reference it)
  await query(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      slug VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      domain VARCHAR(255),
      plan VARCHAR(50) DEFAULT 'basic',
      "isActive" BOOLEAN DEFAULT TRUE,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Courts table
  await query(`
    CREATE TABLE IF NOT EXISTS courts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      location TEXT,
      description TEXT,
      amenities JSONB DEFAULT '[]'::jsonb,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ
    )
  `);

  // Users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      password TEXT,
      "membershipType" TEXT DEFAULT 'basic',
      "duprRating" NUMERIC(4,2),
      "preferredPosition" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ,
      UNIQUE(tenant_id, email)
    )
  `);

  // Coaches table
  await query(`
    CREATE TABLE IF NOT EXISTS coaches (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      bio TEXT,
      specialties JSONB DEFAULT '[]'::jsonb,
      "hourlyRate" NUMERIC(10,2),
      password TEXT,
      "isActive" BOOLEAN DEFAULT TRUE,
      availability JSONB DEFAULT '[]'::jsonb,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ,
      UNIQUE(tenant_id, email)
    )
  `);

  // Time slots table
  await query(`
    CREATE TABLE IF NOT EXISTS time_slots (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      "courtId" TEXT NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      "startTime" TEXT NOT NULL,
      "endTime" TEXT NOT NULL,
      available BOOLEAN DEFAULT TRUE,
      blocked BOOLEAN DEFAULT FALSE,
      type TEXT,
      "clinicId" TEXT,
      comments JSONB DEFAULT '[]'::jsonb,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ
    )
  `);

  // Reservations table
  await query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      "timeSlotId" TEXT NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
      "courtId" TEXT NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
      "playerName" TEXT NOT NULL,
      "playerEmail" TEXT NOT NULL,
      "playerPhone" TEXT NOT NULL,
      players INTEGER NOT NULL DEFAULT 1,
      participants JSONB DEFAULT '[]'::jsonb,
      "paymentStatus" TEXT,
      "paymentIntentId" TEXT,
      "amountPaid" NUMERIC(10,2),
      comments JSONB DEFAULT '[]'::jsonb,
      "createdById" TEXT REFERENCES users(id) ON DELETE SET NULL,
      "isOpenPlay" BOOLEAN NOT NULL DEFAULT FALSE,
      "openPlaySlots" INTEGER,
      "playersPerCourt" INTEGER,
      "maxOpenPlayers" INTEGER,
      "openPlayGroupId" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ
    )
  `);

  // Clinics table
  await query(`
    CREATE TABLE IF NOT EXISTS clinics (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      "coachId" TEXT NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      "startTime" TEXT NOT NULL,
      "endTime" TEXT NOT NULL,
      "timeSlotId" TEXT REFERENCES time_slots(id) ON DELETE SET NULL,
      "maxParticipants" INTEGER DEFAULT 8,
      participants JSONB DEFAULT '[]'::jsonb,
      price NUMERIC(10,2) DEFAULT 0,
      level TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ
    )
  `);

  // Settings table — keyed by tenant_id instead of hardcoded id='1'
  await query(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      "courtName" TEXT,
      "advanceBookingLimit" INTEGER DEFAULT 24,
      "cancellationDeadline" INTEGER DEFAULT 2,
      "maxPlayersPerSlot" INTEGER DEFAULT 4,
      "minPlayersPerSlot" INTEGER DEFAULT 1,
      "allowWalkIns" BOOLEAN DEFAULT TRUE,
      "requirePayment" BOOLEAN DEFAULT FALSE,
      "timeSlotVisibilityPeriod" TEXT DEFAULT '4_weeks',
      "operatingHours" JSONB,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ,
      UNIQUE(tenant_id)
    )
  `);

  // Social groups table
  await query(`
    CREATE TABLE IF NOT EXISTS social_groups (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      "skillLevel" VARCHAR(50),
      "organizerId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "isActive" BOOLEAN DEFAULT TRUE,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ
    )
  `);

  // Indexes
  await query(`CREATE INDEX IF NOT EXISTS idx_social_groups_tenant ON social_groups(tenant_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_courts_tenant ON courts(tenant_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_coaches_tenant ON coaches(tenant_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(date)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_time_slots_court ON time_slots("courtId")`);
  await query(`CREATE INDEX IF NOT EXISTS idx_time_slots_tenant ON time_slots(tenant_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_reservations_timeslot ON reservations("timeSlotId")`);
  await query(`CREATE INDEX IF NOT EXISTS idx_reservations_court ON reservations("courtId")`);
  await query(`CREATE INDEX IF NOT EXISTS idx_reservations_email ON reservations("playerEmail")`);
  await query(`CREATE INDEX IF NOT EXISTS idx_reservations_tenant ON reservations(tenant_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_clinics_date ON clinics(date)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_clinics_tenant ON clinics(tenant_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_settings_tenant ON settings(tenant_id)`);

  console.log('Database schema initialized');

  // Seed a default tenant if none exist
  const { rows: tenantRows } = await query('SELECT COUNT(*) as count FROM tenants');
  if (parseInt(tenantRows[0].count) === 0) {
    console.log('Creating default tenant and loading initial data...');
    await loadInitialData();
  }
}

async function loadInitialData() {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const now = new Date().toISOString();
    const tenantId = 'default';

    // Create default tenant
    await client.query(
      `INSERT INTO tenants (id, slug, name, "createdAt") VALUES ($1, $2, $3, $4)`,
      [tenantId, 'default', 'Default Venue', now]
    );

    // Insert courts
    await client.query(
      `INSERT INTO courts (id, tenant_id, name, location, description, amenities, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['court-1', tenantId, 'Center Court', 'Main Building', 'Premier outdoor court', JSON.stringify(['Lighting', 'Nets', 'Seating']), now]
    );
    await client.query(
      `INSERT INTO courts (id, tenant_id, name, location, description, amenities, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['court-2', tenantId, 'North Court', 'North Wing', 'Outdoor court with shade', JSON.stringify(['Lighting', 'Nets']), now]
    );

    // Insert sample user
    await client.query(
      `INSERT INTO users (id, tenant_id, name, email, phone, "duprRating", "preferredPosition", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      ['user-1', tenantId, 'Admin User', 'admin@picklepop.com', '555-0100', 4.5, 'Right', now]
    );

    // Insert sample coach
    await client.query(
      `INSERT INTO coaches (id, tenant_id, name, email, phone, bio, specialties, "hourlyRate", password, "isActive", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      ['coach-1', tenantId, 'John Smith', 'john@picklepop.com', '555-0101', 'Professional pickleball coach', JSON.stringify(['Beginners', 'Advanced']), 75, 'password123', true, now]
    );

    // Insert default settings
    await client.query(
      `INSERT INTO settings (id, tenant_id, "courtName", "advanceBookingLimit", "cancellationDeadline", "maxPlayersPerSlot", "minPlayersPerSlot", "allowWalkIns", "requirePayment", "timeSlotVisibilityPeriod", "operatingHours", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      ['settings-default', tenantId, 'Pickleball Court', 24, 2, 4, 1, true, false, '4_weeks', JSON.stringify(DEFAULT_OPERATING_HOURS), now]
    );

    await client.query('COMMIT');
    console.log('Initial data loaded');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to load initial data:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function closeDatabase() {
  await pool.end();
}
