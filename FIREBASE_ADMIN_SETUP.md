# Firebase Admin SDK - Vercel Deployment Guide

## Step 1: Convert Service Account Key to String

Your Firebase Admin SDK service account JSON needs to be converted to a single-line string for Vercel environment variables.

### Option A: Minify JSON (Recommended)

```bash
# Copy your service account JSON and minify it:
# Go to: https://jsoncompressor.com/
# Paste your entire JSON file
# Copy the minified output (single line)
```

Or use Node.js locally:

```bash
node -e "console.log(JSON.stringify(require('./firebase-admin-key.json')))"
```

This will output something like:
```
{"type":"service_account","project_id":"hr-sys-cc38d","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"..."}
```

---

## Step 2: Add to Vercel Environment Variables

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your project: **fd-hr-system**
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**

### Add these 2 variables:

#### Variable 1: FIREBASE_ADMIN_SDK_KEY
- **Name**: `FIREBASE_ADMIN_SDK_KEY`
- **Value**: Paste the entire minified JSON string (from Step 1)
- **Environments**: Select all (Production, Preview, Development)
- Click **Save**

#### Variable 2: FIREBASE_DATABASE_URL
- **Name**: `FIREBASE_DATABASE_URL`
- **Value**: `https://hr-sys-cc38d-default-rtdb.firebaseio.com`
- **Environments**: Select all
- Click **Save**

---

## Step 3: Redeploy on Vercel

After adding environment variables:

1. Go to **Deployments** tab
2. Find latest deployment
3. Click **Redeploy** button
4. Wait for build to complete

---

## Step 4: Test Admin SDK

The admin SDK is now available in API routes at `/lib/firebase-admin.ts`.

Use in your API routes:

```typescript
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin not initialized');
    }
    
    // Your admin operations here
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

---

## ⚠️ Security Important:

- ✅ DO: Keep service account key in Vercel environment variables
- ✅ DO: Add firebase-admin-*.json to .gitignore
- ✅ DO: Never commit service account keys
- ❌ DON'T: Share service account keys publicly
- ❌ DON'T: Put keys in client-side code

---

## Troubleshooting

### "Firebase Admin not initialized"
- Check if FIREBASE_ADMIN_SDK_KEY is properly set in Vercel
- Wait 2 minutes after adding variables for them to take effect
- Redeploy the project

### JSON Parse Error
- Make sure the minified JSON is on a single line (no line breaks)
- The JSON must be valid and complete
- Use a JSON validator: https://jsonlint.com/

### Service Account Key Format
The key should look like:
```json
{
  "type": "service_account",
  "project_id": "hr-sys-cc38d",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@hr-sys-cc38d.iam.gserviceaccount.com",
  ...
}
```

---

**After deployment, your admin SDK will be ready for server-side operations!** 🚀
