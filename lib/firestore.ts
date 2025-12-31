// lib/firestore.ts - Firestore Database Helpers with Retry Logic

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  QueryConstraint,
  Timestamp,
  DocumentReference,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Handle Firestore errors with automatic retry logic
 * Retries transient errors up to maxRetries times with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  timeoutMs: number = 30000 // 30 second timeout total
): Promise<T> {
  let lastError: any;
  const startTime = Date.now();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check if we've exceeded total timeout
      if (Date.now() - startTime > timeoutMs) {
        throw new Error('Firestore operation timed out after 30 seconds');
      }

      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable (transient)
      const isRetryable =
        error?.code === 'unavailable' ||
        error?.code === 'deadline-exceeded' ||
        error?.code === 'resource-exhausted' ||
        error?.message?.includes('DEADLINE_EXCEEDED') ||
        error?.message?.includes('temporarily unavailable') ||
        error?.message?.includes('Failed to reach Cloud Firestore');

      if (!isRetryable) {
        throw error;
      }

      // Wait before retrying (exponential backoff: 200ms, 400ms, 800ms, 1.6s, 3.2s)
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms, 1.6s, 3.2s
        console.log(
          `Firestore attempt ${attempt} failed, retrying in ${delayMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

/**
 * Parse Firebase error and provide user-friendly message
 */
function parseFirebaseError(error: any): Error {
  console.error('Firestore error details:', error);

  // Check for specific error codes
  if (error?.code === 'permission-denied') {
    return new Error(
      'You do not have permission to access this data. Please contact an administrator.'
    );
  }

  if (
    error?.code === 'unavailable' ||
    error?.message?.includes('offline') ||
    error?.message?.includes('Failed to reach Cloud Firestore')
  ) {
    return new Error(
      'Database temporarily unavailable. Please check your internet connection and try again.'
    );
  }

  if (error?.code === 'not-found') {
    return new Error('The requested data was not found.');
  }

  if (error?.code === 'invalid-argument') {
    return new Error('Invalid request. Please try again.');
  }

  if (error?.message?.includes('index')) {
    return new Error(
      'Database is being indexed. Please try again in a moment.'
    );
  }

  return (
    error ||
    new Error(
      'An error occurred while accessing the database. Please try again.'
    )
  );
}

export class FirestoreDB {
  /**
   * Add a document to a collection
   */
  static async addDocument<T extends Record<string, any>>(
    collectionName: string,
    data: T
  ): Promise<DocumentReference> {
    if (!db) {
      throw new Error('Firebase not initialized. Please check your environment variables.');
    }
    try {
      return await withRetry(() =>
        addDoc(collection(db!, collectionName), this.prepareData(data))
      );
    } catch (error: any) {
      const friendlyError = parseFirebaseError(error);
      console.error(`Error adding document to ${collectionName}:`, error);
      throw friendlyError;
    }
  }

  /**
   * Get a single document by ID
   */
  static async getDocument<T>(
    collectionName: string,
    docId: string
  ): Promise<T | null> {
    if (!db) {
      throw new Error('Firebase not initialized. Please check your environment variables.');
    }
    try {
      console.log(`[Firestore] Fetching ${collectionName}/${docId}...`);
      return await withRetry(async () => {
        const docRef = doc(db!, collectionName, docId);
        console.log(`[Firestore] Calling getDoc...`);
        const docSnap = await getDoc(docRef);
        console.log(`[Firestore] Document exists:`, docSnap.exists());
        if (docSnap.exists()) {
          console.log(`[Firestore] Document data retrieved successfully`);
          return { id: docSnap.id, ...docSnap.data() } as T;
        }
        console.log(`[Firestore] Document does not exist, returning null`);
        return null; // Document doesn't exist - return null instead of throwing
      });
    } catch (error: any) {
      // Only throw for actual errors, not for missing documents
      console.error(`[Firestore] Error getting document from ${collectionName}:`, error);
      const friendlyError = parseFirebaseError(error);
      throw friendlyError;
    }
  }

  /**
   * Get all documents from a collection
   */
  static async getCollection<T>(collectionName: string): Promise<T[]> {
    if (!db) {
      throw new Error('Firebase not initialized. Please check your environment variables.');
    }
    try {
      return await withRetry(async () => {
        const querySnapshot = await getDocs(collection(db!, collectionName));
        return querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
      });
    } catch (error: any) {
      const friendlyError = parseFirebaseError(error);
      console.error(`Error getting collection ${collectionName}:`, error);
      throw friendlyError;
    }
  }

  /**
   * Query documents with constraints
   */
  static async queryCollection<T>(
    collectionName: string,
    constraints: QueryConstraint[]
  ): Promise<T[]> {
    if (!db) {
      throw new Error('Firebase not initialized. Please check your environment variables.');
    }
    try {
      return await withRetry(async () => {
        const q = query(collection(db!, collectionName), ...constraints);
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
      });
    } catch (error: any) {
      const friendlyError = parseFirebaseError(error);
      console.error(`Error querying ${collectionName}:`, error);
      throw friendlyError;
    }
  }

  /**
   * Update a document
   */
  static async updateDocument(
    collectionName: string,
    docId: string,
    data: Record<string, any>
  ): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized. Please check your environment variables.');
    }
    try {
      await withRetry(async () => {
        const docRef = doc(db!, collectionName, docId);
        await updateDoc(docRef, this.prepareData(data));
      });
    } catch (error: any) {
      const friendlyError = parseFirebaseError(error);
      console.error(`Error updating document in ${collectionName}:`, error);
      throw friendlyError;
    }
  }

  /**
   * Delete a document
   */
  static async deleteDocument(
    collectionName: string,
    docId: string
  ): Promise<void> {
    if (!db) {
      throw new Error('Firebase not initialized. Please check your environment variables.');
    }
    try {
      await withRetry(async () => {
        const docRef = doc(db!, collectionName, docId);
        await deleteDoc(docRef);
      });
    } catch (error: any) {
      const friendlyError = parseFirebaseError(error);
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw friendlyError;
    }
  }

  /**
   * Prepare data for Firestore (convert Date to Timestamp)
   */
  private static prepareData(data: Record<string, any>): Record<string, any> {
    const prepared: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        prepared[key] = Timestamp.fromDate(value);
      } else if (typeof value === 'object' && value !== null) {
        prepared[key] = this.prepareData(value);
      } else {
        prepared[key] = value;
      }
    }
    return prepared;
  }
}
