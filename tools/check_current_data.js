// tools/check_current_data.js - Check current data in Firebase collections

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebase-admin-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://hr-sys-cc38d-default-rtdb.firebaseio.com'
  });
}

const db = admin.firestore();

async function checkCurrentData() {
  try {
    console.log('Checking current data in Firebase collections...\n');

    // Collections to check
    const collections = [
      'attendance',
      'leaves',
      'leaveBalance',
      'salary',
      'salaryConfig',
      'employees',
      'leaveConfig',
      'notifications'
    ];

    for (const collectionName of collections) {
      try {
        const collectionRef = db.collection(collectionName);
        const snapshot = await collectionRef.get();

        console.log(`${collectionName}: ${snapshot.size} documents`);

        if (snapshot.size > 0 && snapshot.size <= 5) {
          console.log('  Documents:');
          snapshot.forEach((doc) => {
            console.log(`    - ${doc.id}:`, JSON.stringify(doc.data(), null, 2));
          });
        } else if (snapshot.size > 5) {
          console.log(`  (Showing first 3 documents)`);
          let count = 0;
          snapshot.forEach((doc) => {
            if (count < 3) {
              console.log(`    - ${doc.id}:`, JSON.stringify(doc.data(), null, 2));
              count++;
            }
          });
        }

        console.log('');

      } catch (error) {
        console.log(`${collectionName}: Error - ${error.message}\n`);
      }
    }

  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    process.exit(0);
  }
}

checkCurrentData();