// tools/cleanup_firebase.js - Complete Firebase Database Cleanup Script

const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth, deleteUser } = require('firebase/auth');
const {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  limit
} = require('firebase/firestore');

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebase-admin-key.json'); // You'll need to provide this

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
});

const db = admin.firestore();
const auth = admin.auth();

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

async function deleteAllUsers() {
  console.log('🗑️ Deleting all Firebase Auth users');

  try {
    let usersDeleted = 0;
    let nextPageToken;

    do {
      const listUsersResult = await auth.listUsers(100, nextPageToken);
      nextPageToken = listUsersResult.pageToken;

      const deletePromises = listUsersResult.users.map(user => {
        console.log(`🗑️ Deleting user: ${user.email} (${user.uid})`);
        return auth.deleteUser(user.uid);
      });

      await Promise.all(deletePromises);
      usersDeleted += listUsersResult.users.length;

    } while (nextPageToken);

    console.log(`✅ Successfully deleted ${usersDeleted} users from Firebase Auth`);

  } catch (error) {
    console.error('❌ Error deleting users:', error);
  }
}

async function cleanupFirebase() {
  console.log('🚨 STARTING COMPLETE FIREBASE CLEANUP 🚨');
  console.log('⚠️  This will delete ALL data from your Firebase project!');
  console.log('⚠️  Make sure you have backups if needed!');
  console.log('');

  try {
    // Delete all Firestore collections
    const collections = [
      'users',
      'employees',
      'attendance',
      'leaves',
      'leaveConfig',
      'leaveBalance',
      'salary',
      'salaryConfig',
      'messages',
      'notifications'
    ];

    for (const collectionName of collections) {
      await deleteCollection(collectionName);
    }

    // Delete all Firebase Auth users
    await deleteAllUsers();

    console.log('');
    console.log('🎉 FIREBASE CLEANUP COMPLETED SUCCESSFULLY!');
    console.log('📝 Your Firebase project is now completely clean.');
    console.log('🔄 You can now run the seed script to populate fresh data.');

  } catch (error) {
    console.error('❌ CRITICAL ERROR during cleanup:', error);
    process.exit(1);
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupFirebase()
    .then(() => {
      console.log('✅ Cleanup script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupFirebase, deleteCollection, deleteAllUsers };