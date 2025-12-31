/*
  tools/seed_employees.js
  - Deletes collections: users, salary, salaryConfig, attendance, leaves, messages
  - Creates 3 real employee user profiles and sets salaryConfig documents

  USAGE:
    1. Install firebase-admin: npm install firebase-admin
    2. Set environment variable pointing to service account JSON file:
       Windows PowerShell:
         $env:FIREBASE_ADMIN_SDK_JSON = 'C:\path\to\serviceAccountKey.json'
       OR set raw JSON in FIREBASE_ADMIN_SDK_JSON_CONTENT
    3. Run: node tools/seed_employees.js

  WARNING: This script DELETES documents. Run only when you understand consequences.
*/

const admin = require('firebase-admin');
const fs = require('fs');

function initAdmin() {
  const keyPath = process.env.FIREBASE_ADMIN_SDK_JSON;
  const keyContent = process.env.FIREBASE_ADMIN_SDK_JSON_CONTENT;

  if (keyPath && fs.existsSync(keyPath)) {
    const serviceAccount = require(keyPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    return admin.firestore();
  }

  if (keyContent) {
    const serviceAccount = JSON.parse(keyContent);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    return admin.firestore();
  }

  console.error('Missing service account credentials. Set FIREBASE_ADMIN_SDK_JSON path or FIREBASE_ADMIN_SDK_JSON_CONTENT.');
  process.exit(1);
}

async function deleteCollection(db, collectionPath) {
  const collectionRef = db.collection(collectionPath);
  const snapshots = await collectionRef.listDocuments();
  console.log(`Deleting documents in collection: ${collectionPath} (count: ${snapshots.length})`);
  const batchSize = 500;
  for (let i = 0; i < snapshots.length; i += batchSize) {
    const batch = db.batch();
    const chunk = snapshots.slice(i, i + batchSize);
    chunk.forEach((docRef) => batch.delete(docRef));
    await batch.commit();
  }
}

async function seed() {
  const db = initAdmin();

  // Collections to purge
  const toPurge = ['users', 'salary', 'salaryConfig', 'attendance', 'leaves', 'messages'];
  for (const c of toPurge) {
    await deleteCollection(db, c);
  }

  // Create 3 employees
  const employees = [
    {
      id: 'emp-1',
      email: 'alice@example.com',
      name: 'Alice Khan',
      role: 'employee',
      department: 'HR',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      id: 'emp-2',
      email: 'bilal@example.com',
      name: 'Bilal Shah',
      role: 'employee',
      department: 'Engineering',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      id: 'emp-3',
      email: 'fatima@example.com',
      name: 'Fatima Noor',
      role: 'employee',
      department: 'Finance',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];

  console.log('Seeding employees...');
  for (const emp of employees) {
    // Use provided id as document id
    await db.collection('users').doc(emp.id).set(emp);

    // Add salaryConfig
    const salaryConfig = {
      userId: emp.id,
      baseSalary: emp.department === 'Finance' ? 80000 : emp.department === 'Engineering' ? 90000 : 60000,
      allowances: [
        { id: 'a1', name: 'Transport', amount: 5000, type: 'fixed' },
        { id: 'a2', name: 'Medical', amount: 5, type: 'percentage' }
      ],
      totalLeavesAllowed: 12,
      workingDaysPerMonth: 26,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('salaryConfig').add(salaryConfig);
  }

  console.log('Seeding complete. Created 3 employees with salaryConfig.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeder error:', err);
  process.exit(1);
});
