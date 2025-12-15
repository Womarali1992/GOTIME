/**
 * Migration script to move data from local storage to PostgreSQL
 * This script reads data from the mock data file and inserts it into PostgreSQL
 *
 * Usage: node --loader ts-node/esm scripts/migrate-local-storage.ts
 */

import { closePool } from '../src/lib/db/connection';
import { PgUserRepository } from '../src/lib/repositories/pg-user-repository';
import { PgCourtRepository } from '../src/lib/repositories/pg-court-repository';
import { PgCoachRepository } from '../src/lib/repositories/pg-coach-repository';
import { PgTimeSlotRepository } from '../src/lib/repositories/pg-time-slot-repository';
import { PgReservationRepository } from '../src/lib/repositories/pg-reservation-repository';
import { PgClinicRepository } from '../src/lib/repositories/pg-clinic-repository';

// Import mock data
import { users, courts, coaches } from '../src/lib/data';

async function migrate() {
  try {
    console.log('Starting migration from local storage to PostgreSQL...\n');

    const userRepo = new PgUserRepository();
    const courtRepo = new PgCourtRepository();
    const coachRepo = new PgCoachRepository();
    const timeSlotRepo = new PgTimeSlotRepository();
    const reservationRepo = new PgReservationRepository();
    const clinicRepo = new PgClinicRepository();

    // Migrate users
    console.log('Migrating users...');
    for (const user of users) {
      await userRepo.create(user);
    }
    console.log(`✅ Migrated ${users.length} users\n`);

    // Migrate coaches
    console.log('Migrating coaches...');
    for (const coach of coaches) {
      await coachRepo.create(coach);
    }
    console.log(`✅ Migrated ${coaches.length} coaches\n`);

    // Migrate courts (includes operating hours)
    console.log('Migrating courts...');
    for (const court of courts) {
      await courtRepo.create(court);
    }
    console.log(`✅ Migrated ${courts.length} courts\n`);

    // Note: Time slots, reservations, and clinics will be generated dynamically
    // by the application based on operating hours and user bookings

    console.log('✅ Migration complete!');
    console.log('\nNext steps:');
    console.log('1. Update your .env file with DATABASE_URL');
    console.log('2. Restart your application');
    console.log('3. The app will generate time slots based on operating hours');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

migrate();
