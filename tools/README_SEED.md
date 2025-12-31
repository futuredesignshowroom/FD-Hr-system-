Seeder README

This folder contains `seed_employees.js` which purges fake data and seeds 3 real employees.

Prerequisites
- Node.js installed
- A Firebase service account JSON for your project

Steps
1. Install dependency:

```bash
npm install firebase-admin
```

2. Set environment variable to the service account JSON path (PowerShell):

```powershell
$env:FIREBASE_ADMIN_SDK_JSON = 'C:\path\to\serviceAccountKey.json'
```

Or set the content directly (not recommended for large JSON):

```powershell
$env:FIREBASE_ADMIN_SDK_JSON_CONTENT = Get-Content -Raw 'C:\path\to\serviceAccountKey.json'
```

3. Run the seeder (this WILL DELETE data in collections listed in script):

```bash
node tools/seed_employees.js
```

Deploy Firestore rules (after firebase login):

```bash
firebase login
firebase deploy --only firestore:rules --project hr-sys-cc38d
```

If you need help obtaining a service account JSON, follow `FIREBASE_ADMIN_SETUP.md` in the repository.
