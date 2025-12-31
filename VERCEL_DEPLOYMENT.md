# HRMS System Deployment Guide

## Vercel Deployment

### 1. Connect to Vercel
```bash
npm i -g vercel
vercel login
vercel --prod
```

Or connect directly via GitHub:
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Paste: https://github.com/futuredesignshowroom/FD-Hr-system-.git
4. Click Import

### 2. Environment Variables
In Vercel Dashboard, go to **Settings > Environment Variables** and add:

```
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_VALUE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_VALUE
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_VALUE
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_VALUE
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_VALUE
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_VALUE
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_VALUE
NEXT_PUBLIC_FIREBASE_REALTIME_DATABASE_URL=YOUR_VALUE
FIREBASE_ADMIN_SDK_KEY=YOUR_VALUE
```

### 3. Firebase Rules Deployment
Deploy Firestore security rules to Firebase:
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### 4. Deployment Complete
After environment variables are set, Vercel will automatically:
- ✅ Build the project
- ✅ Deploy to production
- ✅ Generate HTTPS URL
- ✅ Set up CI/CD

Your app will be live at: `https://fd-hr-system.vercel.app` (or custom domain)

## Local Testing Before Deployment
```bash
npm run build
npm run start
```

## GitHub Auto-Deploy
Any push to `main` branch will automatically trigger:
1. GitHub receives push
2. Vercel webhook fires
3. Build starts
4. Tests run
5. Deploy to production

## Rollback
If deployment fails, Vercel shows logs. Previous version stays live.
Go to Vercel Dashboard > Deployments > select previous version > Promote to Production.
