// lib/firestore.ts - Firestore Database Helpers with Retry Logic and Caching

import {
  collection,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  onSnapshot,
  orderBy,
  limit,
  QueryConstraint,
  Timestamp,
  DocumentReference,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Simple cache interface
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * Cache manager for Firestore data
 */
class FirestoreCache {
  private static cache: Map<string, CacheEntry<any>> = new Map();
  private static readonly CACHE_KEY_PREFIX = 'firestore_cache_';

  static set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void { // Default 5 minutes
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };
    this.cache.set(key, entry);
    
    // Also persist to localStorage for cross-session caching
    try {
      localStorage.setItem(this.CACHE_KEY_PREFIX + key, JSON.stringify(entry));
    } catch (error) {
      // Ignore localStorage errors (e.g., quota exceeded)
    }
  }

  static get<T>(key: string): T | null {
    // Check memory cache first
    let entry = this.cache.get(key);
    
    // If not in memory, check localStorage
    if (!entry) {
      try {
        const stored = localStorage.getItem(this.CACHE_KEY_PREFIX + key);
        if (stored) {
          entry = JSON.parse(stored);
          // Restore to memory cache
          if (entry) this.cache.set(key, entry);
        }
      } catch (error) {
        // Ignore localStorage errors
      }
    }

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      try {
        localStorage.removeItem(this.CACHE_KEY_PREFIX + key);
      } catch (error) {
        // Ignore
      }
      return null;
    }

    return entry.data;
  }

  static invalidate(key: string): void {
    this.cache.delete(key);
    try {
      localStorage.removeItem(this.CACHE_KEY_PREFIX + key);
    } catch (error) {
      // Ignore
    }
  }

  static invalidatePattern(pattern: string): void {
    // Invalidate keys matching pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.invalidate(key);
      }
    }
    // Also check localStorage
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.CACHE_KEY_PREFIX) && key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      // Ignore
    }
  }

  static clear(): void {
    this.cache.clear();
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      // Ignore
    }
  }
}

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
    data: T,
    docId?: string,
    merge: boolean = false
  ): Promise<DocumentReference> {
    if (!db) {
      throw new Error('Firebase not initialized. Please check your environment variables.');
    }
    try {
      const collectionRef = collection(db!, collectionName);
      // If docId is provided, use setDoc with explicit ID, otherwise use addDoc with auto-generated ID
      let result: DocumentReference;
      if (docId) {
        const docRef = doc(collectionRef, docId);
        await withRetry(() =>
          setDoc(docRef, this.prepareData(data), { merge })
        );
        result = docRef;
      } else {
        result = await withRetry(() =>
          addDoc(collectionRef, this.prepareData(data))
        );
      }

      // Invalidate cache for this collection
      this.invalidateCache(collectionName);

      return result;
    } catch (error: any) {
      const friendlyError = parseFirebaseError(error);
      console.error(`Error adding document to ${collectionName}:`, error);
      throw friendlyError;
    }
  }

  /**
   * Subscribe to a collection query in real-time.
   * Returns an unsubscribe function.
   */
  static subscribeCollection<T = any>(
    collectionName: string,
    constraints: QueryConstraint[] = [],
    callback: (docs: T[]) => void,
    onError?: (error: any) => void,
    limitCount: number = 200
  ): () => void {
    if (!db) {
      console.error('Firebase not initialized.');
      return () => {};
    }

    try {
      const q = query(collection(db!, collectionName), ...constraints, orderBy('createdAt', 'desc'), limit(limitCount));
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const docs = querySnapshot.docs.map((d) => ({ id: d.id, ...this.convertData(d.data()) })) as T[];
          callback(docs);
        },
        (error) => {
          console.error(`Error subscribing to ${collectionName}:`, error);
          if (onError) onError(error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error(`Error setting up subscription for ${collectionName}:`, error);
      if (onError) onError?.(error);
      return () => {};
    }
  }

  /**
   * Subscribe to a single document in real-time.
   */
  static subscribeDocument<T = any>(
    collectionName: string,
    docId: string,
    callback: (doc: T | null) => void,
    onError?: (error: any) => void
  ): () => void {
    if (!db) {
      console.error('Firebase not initialized.');
      return () => {};
    }

    try {
      const docRef = doc(db!, collectionName, docId);
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (!docSnap.exists()) {
            callback(null);
            return;
          }
          callback({ id: docSnap.id, ...this.convertData(docSnap.data()) } as T);
        },
        (error) => {
          console.error(`Error subscribing to document ${collectionName}/${docId}:`, error);
          if (onError) onError(error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error(`Error setting up document subscription for ${collectionName}/${docId}:`, error);
      if (onError) onError?.(error);
      return () => {};
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
          return { id: docSnap.id, ...this.convertData(docSnap.data()) } as T;
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
   * Get all documents from a collection (with caching)
   */
  static async getCollection<T>(collectionName: string, useCache: boolean = true): Promise<T[]> {
    if (!db) {
      throw new Error('Firebase not initialized. Please check your environment variables.');
    }

    const cacheKey = `collection_${collectionName}`;

    // Check cache first
    if (useCache) {
      const cached = FirestoreCache.get<T[]>(cacheKey);
      if (cached) {
        console.log(`Using cached data for ${collectionName}`);
        return cached;
      }
    }

    try {
      const result = await withRetry(async () => {
        const querySnapshot = await getDocs(collection(db!, collectionName));
        return querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...this.convertData(doc.data()),
        })) as T[];
      });

      // Cache the result
      if (useCache) {
        FirestoreCache.set(cacheKey, result);
        console.log(`Cached data for ${collectionName}`);
      }

      return result;
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
          ...this.convertData(doc.data()),
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

      // Invalidate cache for this collection
      this.invalidateCache(collectionName);
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

      // Invalidate cache for this collection
      this.invalidateCache(collectionName);
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

  /**
   * Invalidate cache for a specific collection
   */
  static invalidateCache(collectionName: string): void {
    FirestoreCache.invalidate(`collection_${collectionName}`);
  }

  /**
   * Invalidate cache for collections matching a pattern
   */
  static invalidateCachePattern(pattern: string): void {
    FirestoreCache.invalidatePattern(pattern);
  }

  /**
   * Clear all cache
   */
  static clearCache(): void {
    FirestoreCache.clear();
  }

  /**
   * Convert Firestore data back to app data (convert Timestamp to Date)
   */
  static convertData(data: Record<string, any>): Record<string, any> {
    const converted: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Timestamp) {
        converted[key] = value.toDate();
      } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        converted[key] = this.convertData(value);
      } else {
        converted[key] = value;
      }
    }
    return converted;
  }
}
