// tools/initialize_leave_balances.js - Initialize leave balances for all employees

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project.firebaseio.com'
});

const db = admin.firestore();

async function initializeLeaveBalances() {
  try {
    console.log('Initializing leave balances for all employees...');

    // Get all employees
    const employeesSnapshot = await db.collection('employees').get();
    const employees = employeesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${employees.length} employees`);

    // Get leave policies
    const policiesSnapshot = await db.collection('leaveConfig').get();
    const policies = policiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${policies.length} leave policies`);

    if (policies.length === 0) {
      console.log('No leave policies found. Creating default policies...');

      const defaultPolicies = [
        {
          id: 'sick',
          leaveType: 'sick',
          allowedDaysPerYear: 6,
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
      ];

      for (const policy of defaultPolicies) {
        await db.collection('leaveConfig').doc(policy.id).set(policy);
      }

      console.log('Default policies created');
    }

    const currentYear = new Date().getFullYear();
    let balancesCreated = 0;

    for (const employee of employees) {
      console.log(`Processing employee: ${employee.firstName} ${employee.lastName}`);

      // Check if balances already exist for current year
      const existingBalances = await db.collection('leaveBalance')
        .where('userId', '==', employee.id)
        .where('year', '==', currentYear)
        .get();

      if (!existingBalances.empty) {
        console.log(`Balances already exist for ${employee.firstName} ${employee.lastName}`);
        continue;
      }

      // Create balances for each policy
      for (const policy of policies) {
        const balance = {
          userId: employee.id,
          leaveType: policy.leaveType,
          totalAllowed: policy.allowedDaysPerYear,
          used: 0,
          remaining: policy.allowedDaysPerYear,
          carryForward: 0,
          year: currentYear,
        };

        const docId = `${employee.id}_${policy.leaveType}_${currentYear}`;
        await db.collection('leaveBalance').doc(docId).set(balance);
        balancesCreated++;
        console.log(`Created balance for ${policy.leaveType} leave`);
      }
    }

    console.log(`Successfully created ${balancesCreated} leave balances`);
    console.log('Leave balance initialization completed!');

  } catch (error) {
    console.error('Error initializing leave balances:', error);
  } finally {
    admin.app().delete();
  }
}

initializeLeaveBalances();