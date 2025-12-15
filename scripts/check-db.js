import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'pickleball.db');
const db = new Database(dbPath);

console.log('=== Current Settings ===');
const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('1');
if (settings) {
  console.log('Operating Hours:', JSON.parse(settings.operatingHours));
}

console.log('\n=== Time Slots by Day of Week ===');
const slots = db.prepare('SELECT date FROM time_slots ORDER BY date').all();
const dayCount = {};

slots.forEach(slot => {
  const date = new Date(slot.date);
  const dayOfWeek = date.getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[dayOfWeek];

  dayCount[dayName] = (dayCount[dayName] || 0) + 1;
});

console.log(dayCount);

console.log('\n=== Sample Monday Slots ===');
const mondaySlots = db.prepare(`
  SELECT date, startTime, endTime, courtId
  FROM time_slots
  WHERE date IN (
    SELECT DISTINCT date FROM time_slots ORDER BY date LIMIT 20
  )
  ORDER BY date, startTime
  LIMIT 30
`).all();

mondaySlots.forEach(slot => {
  const date = new Date(slot.date);
  const dayOfWeek = date.getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (dayNames[dayOfWeek] === 'Monday') {
    console.log(`${slot.date} (${dayNames[dayOfWeek]}) - ${slot.startTime} to ${slot.endTime} - Court ${slot.courtId}`);
  }
});

db.close();
