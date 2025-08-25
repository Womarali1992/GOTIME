// Debug script to check court and time slot data
import { dataService } from './services/data-service';

export const debugCourtsAndTimeSlots = () => {
  console.log('=== DEBUG: Courts and Time Slots ===');

  // Check courts
  const courts = dataService.getAllCourts();
  console.log('Number of courts:', courts.length);
  courts.forEach(court => {
    console.log(`Court: ${court.id} - ${court.name} at ${court.location}`);
  });

  // Check current date and time
  const now = new Date();
  console.log('\n=== Current Date/Time ===');
  console.log('Current date:', now.toISOString());
  console.log('Current date string:', now.toISOString().split('T')[0]);

  // Check time slots for today
  const today = new Date().toISOString().split('T')[0];
  console.log('\n=== Today\'s Time Slots ===');
  console.log('Date:', today);

  const allTimeSlots = dataService.timeSlotService.getAllTimeSlots();
  console.log('Total time slots in system:', allTimeSlots.length);

  // Get date range of all time slots
  if (allTimeSlots.length > 0) {
    const dates = allTimeSlots.map(slot => slot.date);
    const uniqueDates = [...new Set(dates)].sort();
    console.log('Date range of time slots:', uniqueDates[0], 'to', uniqueDates[uniqueDates.length - 1]);
    console.log('All available dates:', uniqueDates);
  }

  const todaysTimeSlots = allTimeSlots.filter(slot => slot.date === today);
  console.log('Today\'s time slots:', todaysTimeSlots.length);

  if (todaysTimeSlots.length > 0) {
    todaysTimeSlots.slice(0, 10).forEach(slot => {
      console.log(`  ${slot.id}: ${slot.date} ${slot.startTime}-${slot.endTime} Court ${slot.courtId} Available: ${slot.available}`);
    });
  } else {
    console.log('  No time slots found for today!');
    console.log('  Checking if today is within the generated range...');
    const todayDate = new Date(today);
    const todayDayOfWeek = todayDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayDayName = dayNames[todayDayOfWeek];
    console.log(`  Today is a ${todayDayName}`);

    // Check if today should have slots based on operating hours
    const daySettings = dataService.getDaySettings(todayDayName);
    console.log('  Today\'s operating hours:', daySettings);
  }

  // Check next few days
  for (let i = 1; i <= 3; i++) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + i);
    const futureDateString = futureDate.toISOString().split('T')[0];
    const futureSlots = allTimeSlots.filter(slot => slot.date === futureDateString);

    console.log(`\n=== ${futureDateString} (${futureDate.toLocaleDateString('en-US', { weekday: 'long' })}) ===`);
    console.log(`Time slots: ${futureSlots.length}`);

    if (futureSlots.length > 0) {
      futureSlots.slice(0, 5).forEach(slot => {
        console.log(`  ${slot.startTime}-${slot.endTime} Court ${slot.courtId} Available: ${slot.available}`);
      });
    } else {
      console.log('  No time slots found for this date!');
      // Check if this day should have slots
      const futureDayOfWeek = futureDate.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const futureDayName = dayNames[futureDayOfWeek];
      const daySettings = dataService.getDaySettings(futureDayName);
      console.log(`  This day is a ${futureDayName}`);
      console.log(`  Operating hours:`, daySettings);
    }
  }

  // Check data service stats
  console.log('\n=== Data Service Stats ===');
  const stats = dataService.getSystemStats();
  console.log('System stats:', stats);

  console.log('\n=== END DEBUG ===');
};

// Debug function can be called manually if needed
