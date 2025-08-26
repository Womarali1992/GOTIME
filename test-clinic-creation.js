// Test script for clinic creation
// Run this in the browser console on the admin page

// Test clinic creation with valid data
function testClinicCreation() {
  console.log("=== TESTING CLINIC CREATION ===");
  
  // Get the dataService from the window (if it's exposed)
  // or from the React DevTools
  const testClinic = {
    name: "Console Test Clinic " + Date.now(),
    description: "This is a test clinic created from the browser console to debug the creation process. It should appear in the clinics list if everything works correctly.",
    coachId: "1", // Using first coach
    courtId: "1", // Using first court
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    startTime: "14:00",
    endTime: "15:00",
    maxParticipants: 8,
    price: 75
  };
  
  console.log("Test clinic data:", testClinic);
  
  // This would need to be called from the React component context
  // For now, just log the data structure
  console.log("To test manually:");
  console.log("1. Open the Add Clinic form");
  console.log("2. Fill in the following data:");
  console.log("   Name:", testClinic.name);
  console.log("   Description:", testClinic.description);
  console.log("   Coach: First available coach");
  console.log("   Court: First available court");
  console.log("   Date:", testClinic.date);
  console.log("   Start Time:", testClinic.startTime);
  console.log("   End Time:", testClinic.endTime);
  console.log("   Max Participants:", testClinic.maxParticipants);
  console.log("   Price:", testClinic.price);
  console.log("3. Click 'Add Clinic' and check the console for logs");
  
  return testClinic;
}

// Call the test function
testClinicCreation();
