// tools/clean_duplicate_attendance.js - Clean duplicate attendance records

require('dotenv').config({ path: '../.env.local' });
const admin = require('firebase-admin');

function initAdmin() {
  const keyContent = process.env.FIREBASE_ADMIN_SDK_JSON_CONTENT;

  if (keyContent) {
    const serviceAccount = JSON.parse(keyContent);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    return admin.firestore();
  }

  console.error('Missing service account credentials. Set FIREBASE_ADMIN_SDK_JSON_CONTENT.');
  process.exit(1);
}

const db = initAdmin();

async function cleanDuplicateAttendance() {
  console.log('🧹 Starting duplicate attendance cleanup...');

  try {
    const attendanceRef = db.collection('attendance');
    const snapshot = await attendanceRef.get();

    if (snapshot.empty) {
      console.log('✅ No attendance records found');
      return;
    }

    const recordsByUserDate = new Map();
    const duplicates = [];

    // Group records by userId and date
    snapshot.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;

      if (!userId || !data.date) {
        console.log(`⚠️ Skipping record ${doc.id} - missing userId or date`);
        return;
      }

      const date = data.date.toDate ? data.date.toDate() : new Date(data.date);
      const dateKey = `${userId}_${date.getFullYear()}_${date.getMonth()}_${date.getDate()}`;

      if (!recordsByUserDate.has(dateKey)) {
        recordsByUserDate.set(dateKey, []);
      }
      recordsByUserDate.get(dateKey).push({ id: doc.id, data, date });
    });

    // Find duplicates (more than one record per user per day)
    for (const [dateKey, records] of recordsByUserDate) {
      if (records.length > 1) {
        console.log(`📅 Found ${records.length} records for ${dateKey}`);
        // Sort by creation time, keep the most recent complete record
        records.sort((a, b) => {
          const aTime = a.data.createdAt?.toDate ? a.data.createdAt.toDate() : new Date(a.data.createdAt || 0);
          const bTime = b.data.createdAt?.toDate ? b.data.createdAt.toDate() : new Date(b.data.createdAt || 0);
          return bTime.getTime() - aTime.getTime();
        });

        // Keep the first (most recent) record, mark others as duplicates
        duplicates.push(...records.slice(1));
      }
    }

    if (duplicates.length === 0) {
      console.log('✅ No duplicate attendance records found');
      return;
    }

    console.log(`🗑️ Deleting ${duplicates.length} duplicate records...`);

    // Delete duplicates in batches
    const batchSize = 10;
    let deletedCount = 0;

    for (let i = 0; i < duplicates.length; i += batchSize) {
      const batch = db.batch();
      const batchRecords = duplicates.slice(i, i + batchSize);

      batchRecords.forEach(record => {
        batch.delete(attendanceRef.doc(record.id));
      });

      await batch.commit();
      deletedCount += batchRecords.length;
      console.log(`✅ Deleted batch of ${batchRecords.length} duplicates`);
    }

    console.log(`✅ Successfully deleted ${deletedCount} duplicate attendance records`);
    console.log('📝 Note: Kept one record per user per day with the most recent data');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    process.exit(0);
  }
}

// Run the cleanup
cleanDuplicateAttendance();