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
  const toPurge = ['users', 'salary', 'salaryConfig', 'attendance', 'leaves', 'messages', 'leaveConfig', 'leaveBalance'];
  for (const c of toPurge) {
    await deleteCollection(db, c);
  }

  // Initialize leave policies
  const leavePolicies = [
    {
      id: 'sick',
      leaveType: 'sick',
      allowedDaysPerYear: 12,
      carryForwardDays: 3,
      requiresApproval: true,
    },
    {
      id: 'casual',
      leaveType: 'casual',
      allowedDaysPerYear: 12,
      carryForwardDays: 0,
      requiresApproval: true,
    },
    {
      id: 'earned',
      leaveType: 'earned',
      allowedDaysPerYear: 30,
      carryForwardDays: 90,
      requiresApproval: true,
    },
    {
      id: 'unpaid',
      leaveType: 'unpaid',
      allowedDaysPerYear: 365,
      carryForwardDays: 0,
      requiresApproval: true,
    },
    {
      id: 'maternity',
      leaveType: 'maternity',
      allowedDaysPerYear: 84,
      carryForwardDays: 0,
      requiresApproval: true,
    },
    {
      id: 'paternity',
      leaveType: 'paternity',
      allowedDaysPerYear: 14,
      carryForwardDays: 0,
      requiresApproval: true,
    },
  ];

  console.log('Initializing leave policies...');
  for (const policy of leavePolicies) {
    await db.collection('leaveConfig').doc(policy.id).set(policy);
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

  // Create admin user
  const adminUser = {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'System Admin',
    role: 'admin',
    department: 'Administration',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  console.log('Creating admin user...');
  await db.collection('users').doc(adminUser.id).set(adminUser);

  // Create employee profiles
  console.log('Creating employee profiles...');
  for (const emp of employees) {
    const employeeProfile = {
      id: emp.id,
      userId: emp.id,
      employeeId: `EMP${emp.id.slice(-4).toUpperCase()}`,
      firstName: emp.name.split(' ')[0],
      lastName: emp.name.split(' ').slice(1).join(' '),
      name: emp.name,
      email: emp.email,
      phone: '+1234567890',
      department: emp.department,
      position: emp.department === 'Engineering' ? 'Software Engineer' : emp.department === 'HR' ? 'HR Specialist' : emp.department === 'Finance' ? 'Accountant' : 'Manager',
      dateOfJoining: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection('employees').doc(emp.id).set(employeeProfile);
  }
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

    // Initialize leave balances for the user
    const currentYear = today.getFullYear();
    const leaveTypes = ['sick', 'casual', 'earned', 'unpaid', 'maternity', 'paternity'];
    
    for (const leaveType of leaveTypes) {
      let totalAllowed = 0;
      if (leaveType === 'sick') totalAllowed = 6;
      else if (leaveType === 'casual') totalAllowed = 12;
      else if (leaveType === 'earned') totalAllowed = 30;
      else if (leaveType === 'unpaid') totalAllowed = 365;
      else if (leaveType === 'maternity') totalAllowed = 84;
      else if (leaveType === 'paternity') totalAllowed = 14;

      const leaveBalance = {
        userId: emp.id,
        leaveType,
        year: currentYear,
        totalAllowed,
        used: 0,
        remaining: totalAllowed,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await db.collection('leaveBalance').add(leaveBalance);
    }

    // Add sample attendance for the last 7 days
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const attendance = {
        userId: emp.id,
        date: dateStr,
        status: Math.random() > 0.1 ? 'present' : 'absent', // 90% present
        checkIn: '09:00',
        checkOut: '17:00',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await db.collection('attendance').add(attendance);
    }

    // Add sample salary for current month
    const currentMonth = today.getMonth() + 1;
    const salary = {
      userId: emp.id,
      month: currentMonth,
      year: currentYear,
      baseSalary: salaryConfig.baseSalary,
      allowances: salaryConfig.allowances.reduce((sum, a) => sum + (a.type === 'fixed' ? a.amount : (salaryConfig.baseSalary * a.amount / 100)), 0),
      deductions: 0,
      netSalary: salaryConfig.baseSalary + salaryConfig.allowances.reduce((sum, a) => sum + (a.type === 'fixed' ? a.amount : (salaryConfig.baseSalary * a.amount / 100)), 0),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection('salary').add(salary);

    // Add a sample leave request
    if (emp.id === 'emp-1') {
      const leaveStart = new Date(today);
      leaveStart.setDate(today.getDate() + 5);
      const leaveEnd = new Date(leaveStart);
      leaveEnd.setDate(leaveStart.getDate() + 1);
      const leave = {
        userId: emp.id,
        type: 'annual',
        startDate: leaveStart.toISOString().split('T')[0],
        endDate: leaveEnd.toISOString().split('T')[0],
        totalDays: 2,
        reason: 'Family emergency',
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await db.collection('leaves').add(leave);
    }
  }

  console.log('Seeding complete. Created 3 employees with salaryConfig, attendance, salary, and leave data.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeder error:', err);
  process.exit(1);
});
