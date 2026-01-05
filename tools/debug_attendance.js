// Debug script to check attendance records
const { FirestoreDB } = require('C:/Users/Futur/Hr System/lib/firestore');

async function checkAttendanceRecords() {
  try {
    console.log('Checking attendance records...');

    // Get all attendance records (limit to 20 for debugging)
    const records = await FirestoreDB.queryCollection('attendance', [], 20);

    console.log(`Found ${records.length} attendance records:`);

    records.forEach((record, index) => {
      console.log(`\nRecord ${index + 1}:`);
      console.log(`  ID: ${record.id}`);
      console.log(`  User ID: ${record.userId}`);
      console.log(`  Check-in Time: ${record.checkInTime}`);
      console.log(`  Check-out Time: ${record.checkOutTime}`);
      console.log(`  Has Check-out: ${!!(record.checkOutTime && record.checkOutTime !== null && record.checkOutTime !== undefined)}`);
      console.log(`  Status: ${record.status}`);
      console.log(`  Created: ${record.createdAt}`);
    });

    // Check for incomplete records
    const incompleteRecords = records.filter(record => {
      const hasCheckIn = !!record.checkInTime;
      const hasCheckOut = !!(record.checkOutTime && record.checkOutTime !== null && record.checkOutTime !== undefined);
      return hasCheckIn && !hasCheckOut;
    });

    console.log(`\nFound ${incompleteRecords.length} incomplete records`);

  } catch (error) {
    console.error('Error checking records:', error);
  }
}

checkAttendanceRecords();