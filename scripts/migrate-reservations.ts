import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/pickleball.db');
const db = new Database(dbPath);

console.log('Starting migration: Add new fields to reservations table...');

try {
  // Check if the new columns already exist
  const tableInfo = db.prepare("PRAGMA table_info(reservations)").all() as any[];
  const columnNames = tableInfo.map((col: any) => col.name);

  console.log('Current columns:', columnNames);

  // Check if migration is needed
  const needsMigration = !columnNames.includes('playerName');

  if (!needsMigration) {
    console.log('Migration already applied. Skipping.');
    db.close();
    process.exit(0);
  }

  console.log('Migration needed. Creating new table structure...');

  // Begin transaction
  db.exec('BEGIN TRANSACTION');

  // Step 1: Rename old table
  db.exec('ALTER TABLE reservations RENAME TO reservations_old');

  // Step 2: Create new table with updated schema
  db.exec(`
    CREATE TABLE reservations (
      id TEXT PRIMARY KEY,
      timeSlotId TEXT NOT NULL,
      courtId TEXT NOT NULL,
      playerName TEXT NOT NULL,
      playerEmail TEXT NOT NULL,
      playerPhone TEXT NOT NULL,
      players INTEGER NOT NULL DEFAULT 1,
      participants TEXT,
      socialId TEXT,
      paymentStatus TEXT,
      paymentIntentId TEXT,
      amountPaid REAL,
      comments TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      FOREIGN KEY (timeSlotId) REFERENCES time_slots(id) ON DELETE CASCADE,
      FOREIGN KEY (courtId) REFERENCES courts(id) ON DELETE CASCADE,
      FOREIGN KEY (socialId) REFERENCES socials(id) ON DELETE SET NULL
    )
  `);

  // Step 3: Copy data from old table to new table (if any exists)
  const oldReservations = db.prepare('SELECT * FROM reservations_old').all();

  if (oldReservations.length > 0) {
    console.log(`Migrating ${oldReservations.length} existing reservations...`);

    const insert = db.prepare(`
      INSERT INTO reservations (
        id, timeSlotId, courtId, playerName, playerEmail, playerPhone,
        players, participants, comments, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const old of oldReservations as any[]) {
      // Try to get user info from userId
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(old.userId);

      insert.run(
        old.id,
        old.timeSlotId,
        old.courtId || 'court-1', // Default courtId if missing
        user?.name || 'Unknown',
        user?.email || 'unknown@example.com',
        user?.phone || '0000000000',
        1, // Default to 1 player
        old.participants || '[]',
        old.comments || '[]',
        old.createdAt,
        old.updatedAt || old.createdAt
      );
    }
  }

  // Step 4: Drop old table
  db.exec('DROP TABLE reservations_old');

  // Commit transaction
  db.exec('COMMIT');

  console.log('Migration completed successfully!');

} catch (error) {
  console.error('Migration failed:', error);
  db.exec('ROLLBACK');
  process.exit(1);
} finally {
  db.close();
}
