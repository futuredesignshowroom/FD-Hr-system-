# Firebase Cleanup Instructions

## 🚨 Complete Firebase Database Reset

This guide will help you completely clean your Firebase project and start fresh.

## Prerequisites

1. **Firebase Admin Key**: You need a Firebase service account key file
2. **Environment Variables**: Make sure your `.env.local` has the correct Firebase config

## Step 1: Get Firebase Admin Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate new private key**
5. Download the JSON file and save it as `firebase-admin-key.json` in the project root

## Step 2: Set Environment Variables

Make sure your `.env.local` file has:
```
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

## Step 3: Run the Cleanup Script

```bash
# Install dependencies (if not already done)
npm install

# Run the cleanup script
npm run cleanup
```

## What Gets Deleted

The cleanup script will delete:

### Firestore Collections:
- ✅ `users` - All user documents
- ✅ `employees` - All employee profiles
- ✅ `attendance` - All attendance records
- ✅ `leaves` - All leave requests
- ✅ `leaveConfig` - Leave configuration
- ✅ `leaveBalance` - Leave balances
- ✅ `salary` - All salary records
- ✅ `salaryConfig` - Salary configuration
- ✅ `messages` - All messages
- ✅ `notifications` - All notifications

### Firebase Auth:
- ✅ **All user accounts** will be permanently deleted

## ⚠️ Important Warnings

- **This action is irreversible!**
- **All data will be permanently lost!**
- **Make sure you have backups if you need any data**
- **Test users and admin accounts will be deleted**

## Step 4: Repopulate with Test Data

After cleanup, run the seed script to add fresh test data:

```bash
npm run seed
```

This will create:
- 1 Admin user
- 10 Employee users
- Sample data for testing

## Troubleshooting

### Error: "firebase-admin-key.json not found"
- Make sure you downloaded the service account key and placed it in the project root
- Rename the downloaded file to `firebase-admin-key.json`

### Error: "Project ID mismatch"
- Check your `.env.local` file has the correct `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

### Error: "Permission denied"
- Make sure the service account has admin privileges
- Check that you're using the correct Firebase project

## Alternative Manual Cleanup

If the script doesn't work, you can manually delete data from Firebase Console:

1. **Firestore**: Go to Firestore Database → Delete collections manually
2. **Auth**: Go to Authentication → Users → Delete users individually

But the automated script is much faster and more thorough!