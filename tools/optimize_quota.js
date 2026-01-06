// tools/clean_and_optimize.js - Clean data and optimize for Firebase quota

const { exec } = require('child_process');
const fs = require('fs');

console.log('🔧 Firebase Quota Optimization Tool');
console.log('=====================================');
console.log('');

console.log('📊 Current Firebase Free Limits:');
console.log('   • Reads: 50,000 per day');
console.log('   • Writes: 20,000 per day');
console.log('   • Deletes: 20,000 per day');
console.log('   • Storage: 1 GiB total');
console.log('');

console.log('🧹 Data Cleaning Options:');
console.log('   1. Clean ALL data (attendance, leaves, salary, employees)');
console.log('   2. Clean only attendance data');
console.log('   3. Clean only leave data');
console.log('   4. Clean only salary data');
console.log('   5. Check current data counts');
console.log('   6. Initialize fresh default data');
console.log('');

console.log('💡 Optimization Tips:');
console.log('   • Removed real-time listeners from attendance page');
console.log('   • Added manual refresh buttons');
console.log('   • Use on-demand data loading instead of subscriptions');
console.log('   • Clean old/unnecessary data regularly');
console.log('');

console.log('📈 Monitor Usage:');
console.log('   • Firebase Console → Usage → Firestore');
console.log('   • Check daily reads/writes/deletes');
console.log('   • Set up billing alerts for quota warnings');
console.log('');

console.log('🚀 To clean all data and start fresh:');
console.log('   1. Go to http://localhost:3000');
console.log('   2. Login as admin');
console.log('   3. Go to Settings page');
console.log('   4. Click "Clean All Data"');
console.log('   5. Click "Initialize Defaults"');
console.log('');

console.log('⚡ Performance Improvements Made:');
console.log('   ✅ Removed real-time listeners from attendance page');
console.log('   ✅ Added manual refresh buttons');
console.log('   ✅ Optimized leave page loading');
console.log('   ✅ Reduced automatic data fetching');
console.log('   ✅ Added data refresh after actions');
console.log('');

// Check if dev server is running
exec('netstat -ano | findstr :3000', (error, stdout) => {
  if (stdout.includes('3000')) {
    console.log('✅ Dev server is running on http://localhost:3000');
  } else {
    console.log('❌ Dev server not running. Run: npm run dev');
  }
});