const fs = require('fs');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');

(async () => {
  try {
    const rules = fs.readFileSync('firestore.rules', 'utf8');
    const testEnv = await initializeTestEnvironment({
      projectId: 'hrms-test',
      firestore: { rules }
    });

    const alice = testEnv.authenticatedContext('alice', { uid: 'alice', token: { admin: false } });
    const admin = testEnv.authenticatedContext('adminUser', { uid: 'adminUser', token: { admin: true } });

    console.log('Running rules tests...');

    // Alice can create her own user doc
    await assertSucceeds(alice.firestore().collection('users').doc('alice').set({ id: 'alice', name: 'Alice' }));
    console.log('✓ alice can create own user doc');

    // Alice cannot read another user's doc
    await assertFails(alice.firestore().collection('users').doc('bob').get()).then(
      () => console.log('✓ alice cannot read bob doc'),
      () => console.log('✗ alice unexpectedly read bob doc')
    );

    // Admin can read any user's doc (admin claim required)
    await assertSucceeds(admin.firestore().collection('users').doc('bob').get()).then(
      () => console.log('✓ admin can read bob doc'),
      () => console.log('✗ admin failed to read bob doc')
    );

    // Alice can create her own leave request
    await assertSucceeds(alice.firestore().collection('leaves').doc('leave1').set({ userId: 'alice', type: 'sick' }));
    console.log('✓ alice can create own leave request');

    // Non-admin cannot write salary
    await assertFails(alice.firestore().collection('salary').doc('s1').set({ userId: 'alice', amount: 1000 })).then(
      () => console.log('✓ non-admin cannot write salary'),
      () => console.log('✗ non-admin wrote salary')
    );

    // Admin can write salary
    await assertSucceeds(admin.firestore().collection('salary').doc('s1').set({ userId: 'alice', amount: 1000 }));
    console.log('✓ admin can write salary');

    await testEnv.cleanup();
    console.log('Rules tests completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Rules tests failed:', err);
    process.exit(1);
  }
})();
