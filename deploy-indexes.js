#!/usr/bin/env node

// deploy-firestore-indexes.js
// Script to deploy Firestore indexes from firestore.indexes.json

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const indexesFile = path.join(__dirname, 'firestore.indexes.json');

try {
  console.log('🚀 Deploying Firestore indexes...');

  if (!fs.existsSync(indexesFile)) {
    console.error('❌ firestore.indexes.json not found!');
    process.exit(1);
  }

  // Deploy indexes using Firebase CLI
  execSync('firebase deploy --only firestore:indexes', {
    stdio: 'inherit',
    cwd: __dirname
  });

  console.log('✅ Firestore indexes deployed successfully!');
  console.log('📝 Note: It may take a few minutes for indexes to be created in Firebase.');

} catch (error) {
  console.error('❌ Failed to deploy Firestore indexes:', error.message);
  console.log('📋 Alternative: Create indexes manually in Firebase Console using these URLs:');
  console.log('   - Attendance (userId + date): https://console.firebase.google.com/v1/r/project/hr-sys-cc38d/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9oci1zeXMtY2MzOGQvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2F0dGVuZGFuY2UvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaCAoEZGF0ZRABGgwKCF9fbmFtZV9fEAE');
  console.log('   - Attendance (userId + createdAt): https://console.firebase.google.com/v1/r/project/hr-sys-cc38d/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9oci1zeXMtY2MzOGQvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2F0dGVuZGFuY2UvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg');
  console.log('   - Leaves (userId + status + startDate): https://console.firebase.google.com/v1/r/project/hr-sys-cc38d/firestore/indexes?create_composite=Cktwcm9qZWN0cy9oci1zeXMtY2MzOGQvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2xlYXZlcy9pbmRleGVzL18QARoKCgZzdGF0dXMQARoKCgZ1c2VySWQQARoNCglzdGFydERhdGUQARoMCghfX25hbWVfXxAB');
  process.exit(1);
}