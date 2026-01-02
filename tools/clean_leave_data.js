// tools/clean_leave_data.js - Clean all leave-related data

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
});

const db = admin.firestore();

async function deleteCollection(collectionName) {
  console.log(`🗑️ Deleting collection: ${collectionName}`);

  try {
    const collectionRef = db.collection(collectionName);
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
      console.log(`✅ Collection ${collectionName} is already empty`);
      return;
    }

    const batchSize = 10;
    let batch = db.batch();
    let count = 0;
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
      count++;

      if (count % batchSize === 0) {
        await batch.commit();
        console.log(`🗑️ Deleted ${count} documents from ${collectionName} (batch ${batchCount + 1})`);
        batch = db.batch();
        batchCount++;
      }
    }

    // Commit remaining documents
    if (count % batchSize !== 0) {
      await batch.commit();
      console.log(`🗑️ Deleted remaining ${count % batchSize} documents from ${collectionName}`);
    }

    console.log(`✅ Successfully deleted ${count} documents from ${collectionName}`);

  } catch (error) {
    console.error(`❌ Error deleting collection ${collectionName}:`, error);
  }
}

async function cleanLeaveData() {
  console.log('🧹 Starting leave data cleanup...');

  try {
    // Delete leave-related collections
    await deleteCollection('leaveConfig');
    await deleteCollection('leaveBalance');
    await deleteCollection('leaves');

    console.log('✅ Leave data cleanup completed successfully!');
    console.log('📝 Note: Only admin-configured leave policies will be available now.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    process.exit(0);
  }
}

// Run the cleanup
cleanLeaveData();