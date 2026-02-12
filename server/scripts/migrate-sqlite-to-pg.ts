/**
 * One-time migration script: SQLite → PostgreSQL
 *
 * Usage:
 *   DATABASE_URL=postgresql://user:pass@host:5432/picklepop npx tsx server/scripts/migrate-sqlite-to-pg.ts path/to/pickleball.db
 *
 * Tables are migrated in FK order:
 *   courts → users → coaches → settings → time_slots → clinics → reservations
 */

import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';

const { Pool } = pg;

const sqlitePath = process.argv[2];
if (!sqlitePath) {
  console.error('Usage: npx tsx server/scripts/migrate-sqlite-to-pg.ts <sqlite-db-path>');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/picklepop',
});

const sqliteDb = new Database(path.resolve(sqlitePath));
sqliteDb.pragma('foreign_keys = OFF');

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Courts
    const courts = sqliteDb.prepare('SELECT * FROM courts').all() as any[];
    for (const c of courts) {
      await client.query(
        `INSERT INTO courts (id, name, location, description, amenities, "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
        [c.id, c.name, c.location, c.description, c.amenities || '[]', c.createdAt, c.updatedAt]
      );
    }
    console.log(`Migrated ${courts.length} courts`);

    // 2. Users
    const users = sqliteDb.prepare('SELECT * FROM users').all() as any[];
    for (const u of users) {
      await client.query(
        `INSERT INTO users (id, name, email, phone, password, "membershipType", "duprRating", "preferredPosition", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
        [u.id, u.name, u.email, u.phone, u.password, u.membershipType || 'basic', u.duprRating, u.preferredPosition, u.createdAt, u.updatedAt]
      );
    }
    console.log(`Migrated ${users.length} users`);

    // 3. Coaches
    const coaches = sqliteDb.prepare('SELECT * FROM coaches').all() as any[];
    for (const c of coaches) {
      await client.query(
        `INSERT INTO coaches (id, name, email, phone, bio, specialties, "hourlyRate", password, "isActive", availability, "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO NOTHING`,
        [c.id, c.name, c.email, c.phone, c.bio, c.specialties || '[]', c.hourlyRate, c.password, c.isActive === 1 || c.isActive === true, c.availability || '[]', c.createdAt, c.updatedAt]
      );
    }
    console.log(`Migrated ${coaches.length} coaches`);

    // 4. Settings
    const settings = sqliteDb.prepare('SELECT * FROM settings').all() as any[];
    for (const s of settings) {
      await client.query(
        `INSERT INTO settings (id, "courtName", "advanceBookingLimit", "cancellationDeadline", "maxPlayersPerSlot", "minPlayersPerSlot", "allowWalkIns", "requirePayment", "timeSlotVisibilityPeriod", "operatingHours", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO NOTHING`,
        [s.id, s.courtName, s.advanceBookingLimit, s.cancellationDeadline, s.maxPlayersPerSlot, s.minPlayersPerSlot, Boolean(s.allowWalkIns), Boolean(s.requirePayment), s.timeSlotVisibilityPeriod, s.operatingHours || '[]', s.createdAt, s.updatedAt]
      );
    }
    console.log(`Migrated ${settings.length} settings`);

    // 5. Time slots
    const timeSlots = sqliteDb.prepare('SELECT * FROM time_slots').all() as any[];
    for (const t of timeSlots) {
      await client.query(
        `INSERT INTO time_slots (id, "courtId", date, "startTime", "endTime", available, blocked, type, "clinicId", comments, "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO NOTHING`,
        [t.id, t.courtId, t.date, t.startTime, t.endTime, Boolean(t.available), Boolean(t.blocked), t.type, t.clinicId, t.comments || '[]', t.createdAt, t.updatedAt]
      );
    }
    console.log(`Migrated ${timeSlots.length} time_slots`);

    // 6. Clinics
    const clinics = sqliteDb.prepare('SELECT * FROM clinics').all() as any[];
    for (const c of clinics) {
      await client.query(
        `INSERT INTO clinics (id, "coachId", title, description, date, "startTime", "endTime", "timeSlotId", "maxParticipants", participants, price, level, "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (id) DO NOTHING`,
        [c.id, c.coachId, c.title, c.description, c.date, c.startTime, c.endTime, c.timeSlotId, c.maxParticipants, c.participants || '[]', c.price, c.level, c.createdAt, c.updatedAt]
      );
    }
    console.log(`Migrated ${clinics.length} clinics`);

    // 7. Reservations
    const reservations = sqliteDb.prepare('SELECT * FROM reservations').all() as any[];
    for (const r of reservations) {
      await client.query(
        `INSERT INTO reservations (id, "timeSlotId", "courtId", "playerName", "playerEmail", "playerPhone", players, participants, "paymentStatus", "paymentIntentId", "amountPaid", comments, "createdById", "isOpenPlay", "openPlaySlots", "playersPerCourt", "maxOpenPlayers", "openPlayGroupId", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) ON CONFLICT (id) DO NOTHING`,
        [r.id, r.timeSlotId, r.courtId, r.playerName, r.playerEmail, r.playerPhone, r.players, r.participants || '[]', r.paymentStatus, r.paymentIntentId, r.amountPaid, r.comments || '[]', r.createdById, Boolean(r.isOpenPlay), r.openPlaySlots, r.playersPerCourt, r.maxOpenPlayers, r.openPlayGroupId, r.createdAt, r.updatedAt]
      );
    }
    console.log(`Migrated ${reservations.length} reservations`);

    await client.query('COMMIT');
    console.log('\nMigration complete!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    sqliteDb.close();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
