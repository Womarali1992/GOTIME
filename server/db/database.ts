import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/pickleball.db');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  console.log('Initializing SQLite database...');

  // Courts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS courts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      description TEXT,
      amenities TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT
    )
  `);

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      duprRating REAL,
      preferredPosition TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT
    )
  `);

  // Coaches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS coaches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      bio TEXT,
      specialties TEXT,
      hourlyRate REAL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT
    )
  `);

  // Time slots table
  db.exec(`
    CREATE TABLE IF NOT EXISTS time_slots (
      id TEXT PRIMARY KEY,
      courtId TEXT NOT NULL,
      date TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      available INTEGER DEFAULT 1,
      blocked INTEGER DEFAULT 0,
      type TEXT,
      clinicId TEXT,
      socialId TEXT,
      comments TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      FOREIGN KEY (courtId) REFERENCES courts(id) ON DELETE CASCADE
    )
  `);

  // Reservations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
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

  // Clinics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clinics (
      id TEXT PRIMARY KEY,
      coachId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      timeSlotId TEXT,
      maxParticipants INTEGER DEFAULT 8,
      participants TEXT,
      price REAL DEFAULT 0,
      level TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      FOREIGN KEY (coachId) REFERENCES coaches(id) ON DELETE CASCADE,
      FOREIGN KEY (timeSlotId) REFERENCES time_slots(id) ON DELETE SET NULL
    )
  `);

  // Socials table
  db.exec(`
    CREATE TABLE IF NOT EXISTS socials (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      timeSlotId TEXT,
      status TEXT DEFAULT 'active',
      votes TEXT,
      createdById TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      FOREIGN KEY (timeSlotId) REFERENCES time_slots(id) ON DELETE SET NULL,
      FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      courtName TEXT,
      advanceBookingLimit INTEGER DEFAULT 24,
      cancellationDeadline INTEGER DEFAULT 2,
      maxPlayersPerSlot INTEGER DEFAULT 4,
      minPlayersPerSlot INTEGER DEFAULT 1,
      allowWalkIns INTEGER DEFAULT 1,
      requirePayment INTEGER DEFAULT 0,
      timeSlotVisibilityPeriod TEXT DEFAULT '4_weeks',
      operatingHours TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(date);
    CREATE INDEX IF NOT EXISTS idx_time_slots_court ON time_slots(courtId);
    CREATE INDEX IF NOT EXISTS idx_reservations_timeslot ON reservations(timeSlotId);
    CREATE INDEX IF NOT EXISTS idx_reservations_court ON reservations(courtId);
    CREATE INDEX IF NOT EXISTS idx_reservations_email ON reservations(playerEmail);
    CREATE INDEX IF NOT EXISTS idx_clinics_date ON clinics(date);
    CREATE INDEX IF NOT EXISTS idx_socials_date ON socials(date);
  `);

  console.log('Database initialized successfully');

  // Load initial data if tables are empty
  const courtCount = db.prepare('SELECT COUNT(*) as count FROM courts').get() as { count: number };
  if (courtCount.count === 0) {
    console.log('Loading initial data...');
    loadInitialData();
  }
}

function loadInitialData() {
  // Import and insert initial data from data.ts
  const insertCourt = db.prepare(`
    INSERT INTO courts (id, name, location, description, amenities, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, phone, duprRating, preferredPosition, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCoach = db.prepare(`
    INSERT INTO coaches (id, name, email, phone, bio, specialties, hourlyRate, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSettings = db.prepare(`
    INSERT INTO settings (id, courtName, advanceBookingLimit, cancellationDeadline, maxPlayersPerSlot, minPlayersPerSlot, allowWalkIns, requirePayment, timeSlotVisibilityPeriod, operatingHours, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Sample data
  const transaction = db.transaction(() => {
    // Insert courts
    insertCourt.run('court-1', 'Center Court', 'Main Building', 'Premier outdoor court', JSON.stringify(['Lighting', 'Nets', 'Seating']), new Date().toISOString());
    insertCourt.run('court-2', 'North Court', 'North Wing', 'Outdoor court with shade', JSON.stringify(['Lighting', 'Nets']), new Date().toISOString());

    // Insert sample user
    insertUser.run('user-1', 'Admin User', 'admin@picklepop.com', '555-0100', 4.5, 'Right', new Date().toISOString());

    // Insert sample coach
    insertCoach.run('coach-1', 'John Smith', 'john@picklepop.com', '555-0101', 'Professional pickleball coach', JSON.stringify(['Beginners', 'Advanced']), 75, new Date().toISOString());

    // Insert default settings
    const defaultOperatingHours = [
      { dayOfWeek: 'monday', isOpen: true, startTime: '08:00', endTime: '20:00', timeSlotDuration: 60, breakTime: 15 },
      { dayOfWeek: 'tuesday', isOpen: true, startTime: '08:00', endTime: '20:00', timeSlotDuration: 60, breakTime: 15 },
      { dayOfWeek: 'wednesday', isOpen: true, startTime: '08:00', endTime: '20:00', timeSlotDuration: 60, breakTime: 15 },
      { dayOfWeek: 'thursday', isOpen: true, startTime: '08:00', endTime: '20:00', timeSlotDuration: 60, breakTime: 15 },
      { dayOfWeek: 'friday', isOpen: true, startTime: '08:00', endTime: '20:00', timeSlotDuration: 60, breakTime: 15 },
      { dayOfWeek: 'saturday', isOpen: true, startTime: '08:00', endTime: '18:00', timeSlotDuration: 60, breakTime: 15 },
      { dayOfWeek: 'sunday', isOpen: true, startTime: '10:00', endTime: '18:00', timeSlotDuration: 60, breakTime: 15 }
    ];

    insertSettings.run('1', 'Pickleball Court', 24, 2, 4, 1, 1, 0, '4_weeks', JSON.stringify(defaultOperatingHours), new Date().toISOString());
  });

  transaction();
  console.log('Initial data loaded');
}

export function closeDatabase() {
  db.close();
}
