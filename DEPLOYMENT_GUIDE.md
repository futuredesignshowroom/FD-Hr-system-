# 🚀 HRMS System - Deployment Guide

## Quick Start

### Step 1: Copy `.env.local`
```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your Firebase credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_FIREBASE_REALTIME_DATABASE_URL=your_realtime_db_url
```

### Step 2: Local Testing
```bash
npm install
npm run dev
```
Visit http://localhost:3000

### Step 3: Deploy to Vercel

#### Option A: GitHub Integration (Recommended)
1. Push code to GitHub (already done ✅)
2. Go to https://vercel.com/new
3. Click "Import Git Repository"
4. Select your GitHub repo: `FD-Hr-system-`
5. Click "Import"

#### Option B: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel
```

### Step 4: Add Environment Variables to Vercel

**In Vercel Dashboard:**
1. Go to your Project
2. Settings → Environment Variables
3. Add each variable from `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
NEXT_PUBLIC_FIREBASE_REALTIME_DATABASE_URL=...
```

⚠️ **Important:** Only add `NEXT_PUBLIC_*` variables here.

### Step 5: Deploy Firestore Rules

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

## ✅ Deployment Checklist

- [ ] `.env.local` copied with all Firebase credentials
- [ ] `npm run build` passes without errors
- [ ] GitHub repo is up to date
- [ ] Vercel project is connected to GitHub
- [ ] Environment variables added to Vercel
- [ ] Firestore rules deployed
- [ ] Test login at deployed URL

## 🎯 After Deployment

Your app will be live at:
```
https://your-project.vercel.app
```

### Auto-Deploy on Git Push
Any push to `main` branch will automatically trigger deployment!

## 🐛 Troubleshooting

### "Invalid API Key" Error
- Check that all `NEXT_PUBLIC_*` variables are set in Vercel
- Verify credentials are correct in Firebase Console

### Build Fails
- Make sure `.env.local` exists locally
- Run `npm install` to update dependencies
- Check build logs in Vercel Dashboard

### Firebase Connection Error
- Verify Firestore Database is running (not deleted)
- Check Firebase Security Rules allow your app
- Verify database URL is correct

## 📝 Project Structure

```
├── app/                  # Next.js App Router
│   ├── (auth)/          # Auth pages (login, signup)
│   ├── (admin)/         # Admin dashboard
│   ├── (employee)/      # Employee dashboard
│   └── api/             # API routes
├── services/            # Firebase services
├── components/          # React components
├── lib/                 # Firebase & utilities
├── store/               # Zustand state management
└── types/               # TypeScript types
```

## 📚 Firebase Console
Go to https://console.firebase.google.com to:
- View/edit Security Rules
- Monitor Firestore usage
- Manage users
- Check authentication methods

---

**Happy Deploying! 🎉**
