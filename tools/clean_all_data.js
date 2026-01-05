// tools/clean_all_data.js - Clean all data from Firebase collections

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Note: You'll need to set up your firebase-admin-key.json file
// For now, this is a template - you'll need to add your service account key

async function cleanAllData() {
  try {
    console.log('Starting data cleanup...');

    // Collections to clean
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
      console.log(`Cleaning collection: ${collectionName}`);

      try {
        const collectionRef = admin.firestore().collection(collectionName);
        const snapshot = await collectionRef.get();

        if (snapshot.empty) {
          console.log(`  Collection ${collectionName} is already empty`);
          continue;
        }

        // Delete all documents in batches
        const batchSize = 10;
        let batch = admin.firestore().batch();
        let count = 0;
        let batchCount = 0;

        for (const doc of snapshot.docs) {
          batch.delete(doc.ref);
          count++;

          if (count % batchSize === 0) {
            await batch.commit();
            batch = admin.firestore().batch();
            batchCount++;
            console.log(`  Deleted ${count} documents from ${collectionName} (batch ${batchCount})`);
          }
        }

        // Commit remaining documents
        if (count % batchSize !== 0) {
          await batch.commit();
          batchCount++;
          console.log(`  Deleted remaining ${count % batchSize} documents from ${collectionName} (batch ${batchCount})`);
        }

        console.log(`  Successfully cleaned ${collectionName}: ${count} documents deleted`);

      } catch (error) {
        console.error(`  Error cleaning ${collectionName}:`, error.message);
      }
    }

    console.log('Data cleanup completed successfully!');
    console.log('Note: Default leave policies and other system configs have been preserved.');

  } catch (error) {
    console.error('Error during data cleanup:', error);
  } finally {
    // Close the Firebase app
    if (admin.apps.length > 0) {
      await admin.app().delete();
    }
  }
}

// Export for use in other scripts
module.exports = { cleanAllData };

// Run if called directly
if (require.main === module) {
  // You'll need to initialize Firebase Admin here
  console.log('Please set up your Firebase Admin SDK configuration first.');
  console.log('Copy your service account key to firebase-admin-key.json');
  console.log('Then uncomment the initialization code below.');

  /*
  const serviceAccount = require('../firebase-admin-key.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://your-project.firebaseio.com'
  });

  cleanAllData();
  */
}