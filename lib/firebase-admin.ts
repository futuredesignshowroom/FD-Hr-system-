// lib/firebase-admin.ts - Server-side Firebase Admin SDK

import * as admin from 'firebase-admin';

// Initialize Admin SDK only once
if (!admin.apps.length) {
  try {
    // Get service account from environment variable or file
    const serviceAccountKey = process.env.FIREBASE_ADMIN_SDK_KEY
      ? JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY)
      : null;

    if (!serviceAccountKey) {
      console.warn('Firebase Admin SDK not initialized - service account key missing');
    } else {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
        databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://hr-sys-cc38d-default-rtdb.firebaseio.com'
      });
      console.log('Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
}

// Export admin services for use in API routes
export const adminAuth = admin.apps.length > 0 ? admin.auth() : null;
export const adminDb = admin.apps.length > 0 ? admin.database() : null;
export const adminFirestore = admin.apps.length > 0 ? admin.firestore() : null;

export default admin;
