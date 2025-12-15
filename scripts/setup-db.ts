/**
 * Database setup script
 * Run this to initialize the PostgreSQL database schema
 *
 * Usage: node --loader ts-node/esm scripts/setup-db.ts
 */

import { initializeDatabase, isDatabaseReady } from '../src/lib/db/setup';
import { closePool } from '../src/lib/db/connection';

async function main() {
  try {
    console.log('Checking database status...');
    const isReady = await isDatabaseReady();

    if (isReady) {
      console.log('⚠️  Database is already initialized.');
      console.log('To reinitialize, run this script with --force flag');

      if (!process.argv.includes('--force')) {
        process.exit(0);
      }
    }

    console.log('Setting up database...');
    await initializeDatabase();
    console.log('✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
