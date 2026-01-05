// tools/initialize_salary_configs.js - Initialize salary configurations for all employees

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project.firebaseio.com'
});

const db = admin.firestore();

async function initializeSalaryConfigs() {
  try {
    console.log('Initializing salary configurations for all employees...');

    // Get all employees
    const employeesSnapshot = await db.collection('employees').get();
    const employees = employeesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${employees.length} employees`);

    let configsCreated = 0;

    for (const employee of employees) {
      console.log(`Processing employee: ${employee.firstName} ${employee.lastName}`);

      // Check if salary config already exists
      const existingConfig = await db.collection('salaryConfig').doc(employee.id).get();

      if (existingConfig.exists) {
        console.log(`Salary config already exists for ${employee.firstName} ${employee.lastName}`);
        continue;
      }

      // Create default salary config
      const salaryConfig = {
        userId: employee.id,
        baseSalary: 30000, // Default base salary
        allowances: [
          {
            id: 'conveyance',
            name: 'Conveyance Allowance',
            amount: 5000,
            type: 'fixed'
          },
          {
            id: 'medical',
            name: 'Medical Allowance',
            amount: 3000,
            type: 'fixed'
          }
        ],
        totalLeavesAllowed: 30,
        workingDaysPerMonth: 26,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection('salaryConfig').doc(employee.id).set(salaryConfig);
      configsCreated++;

      console.log(`Created salary config for ${employee.firstName} ${employee.lastName}`);
    }

    console.log(`Successfully created ${configsCreated} salary configurations`);
    console.log('Salary configuration initialization completed!');

  } catch (error) {
    console.error('Error initializing salary configurations:', error);
  } finally {
    admin.app().delete();
  }
}

initializeSalaryConfigs();